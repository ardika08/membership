<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class StatsController extends Controller
{
    /** Nama bulan pendek bahasa Indonesia — selaras dengan chart frontend. */
    protected array $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    public function index(): JsonResponse
    {
        $paid = Transaction::where('status', 'paid')
            ->whereNotNull('paid_at')
            ->get(['paid_at', 'amount', 'product_id']);

        $thisMonth = $paid->filter(fn ($t) => $t->paid_at->isSameMonth(now()));
        $lastMonth = $paid->filter(fn ($t) => $t->paid_at->isSameMonth(now()->subMonth()));

        $members = User::where('role', 'member')->get(['created_at']);

        return response()->json([
            'data' => [
                'revenue' => (int) $paid->sum('amount'),
                'revenueGrowth' => $this->growth($thisMonth->sum('amount'), $lastMonth->sum('amount')),
                'orders' => $paid->count(),
                'ordersGrowth' => $this->growth($thisMonth->count(), $lastMonth->count()),
                'users' => $members->count(),
                'usersGrowth' => $this->growth(
                    $members->filter(fn ($u) => $u->created_at->isSameMonth(now()))->count(),
                    $members->filter(fn ($u) => $u->created_at->isSameMonth(now()->subMonth()))->count(),
                ),
                'products' => Product::count(),
                'productsGrowth' => 0,
                'revenueSeries' => $this->revenueSeries($paid),
                'userGrowthSeries' => $this->userGrowthSeries($members),
                'categoryBreakdown' => $this->categoryBreakdown($paid),
                'popularProducts' => $this->popularProducts($paid),
            ],
        ]);
    }

    protected function growth(float $current, float $previous): int
    {
        if ($previous <= 0) {
            return $current > 0 ? 100 : 0;
        }

        return (int) round((($current - $previous) / $previous) * 100);
    }

    /** Agregasi di PHP agar portabel antara MySQL & SQLite. */
    protected function bucket(Collection $items, string $dateField, array $initial, \Closure $reducer): array
    {
        $series = [];
        for ($i = 11; $i >= 0; $i--) {
            $cursor = now()->subMonths($i)->startOfMonth();
            $series[$cursor->format('Y-m')] = [
                'month' => $this->months[(int) $cursor->format('n') - 1],
                ...$initial,
            ];
        }

        foreach ($items as $item) {
            $key = $item->{$dateField}?->format('Y-m');
            if ($key && isset($series[$key])) {
                $reducer($series[$key], $item);
            }
        }

        return array_values($series);
    }

    protected function revenueSeries(Collection $paid): array
    {
        return $this->bucket(
            $paid,
            'paid_at',
            ['revenue' => 0, 'orders' => 0],
            function (&$bucket, $trx) {
                $bucket['revenue'] += $trx->amount;
                $bucket['orders'] += 1;
            },
        );
    }

    protected function userGrowthSeries(Collection $members): array
    {
        // Kumulatif: total member hingga akhir tiap bulan.
        $counts = [];
        foreach ($members as $member) {
            $key = $member->created_at->format('Y-m');
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }

        $series = [];
        $cumulative = 0;
        for ($i = 11; $i >= 0; $i--) {
            $cursor = now()->subMonths($i)->startOfMonth();
            $cumulative += $counts[$cursor->format('Y-m')] ?? 0;

            $series[] = [
                'month' => $this->months[(int) $cursor->format('n') - 1],
                'users' => $cumulative,
            ];
        }

        return $series;
    }

    protected function categoryBreakdown(Collection $paid): array
    {
        $products = Product::get(['id', 'category_slug'])->keyBy('id');

        $totals = [];
        foreach ($paid as $trx) {
            $category = $products[$trx->product_id]->category_slug ?? 'lainnya';
            $totals[$category] = ($totals[$category] ?? 0) + $trx->amount;
        }

        arsort($totals);

        return array_map(
            fn ($category, $value) => ['category' => $category, 'value' => (int) $value],
            array_keys($totals),
            $totals,
        );
    }

    protected function popularProducts(Collection $paid): array
    {
        $revenues = [];
        foreach ($paid as $trx) {
            $revenues[$trx->product_id] = ($revenues[$trx->product_id] ?? 0) + $trx->amount;
        }

        return Product::orderByDesc('sales')
            ->limit(5)
            ->get(['id', 'title', 'sales'])
            ->map(fn ($product) => [
                'id' => $product->id,
                'title' => $product->title,
                'sales' => $product->sales,
                'revenue' => (int) ($revenues[$product->id] ?? 0),
            ])
            ->values()
            ->all();
    }
}
