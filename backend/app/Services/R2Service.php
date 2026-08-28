<?php

namespace App\Services;

use Aws\S3\S3Client;

class R2Service
{
    protected S3Client $client;

    public function enabled(): bool
    {
        return (bool) (config('r2.account_id') && config('r2.access_key') && config('r2.secret_key'));
    }

    protected function client(): S3Client
    {
        if (! isset($this->client)) {
            $this->client = new S3Client([
                'version' => 'latest',
                'region' => config('r2.region'),
                'endpoint' => config('r2.endpoint'),
                'credentials' => [
                    'key' => config('r2.access_key'),
                    'secret' => config('r2.secret_key'),
                ],
            ]);
        }

        return $this->client;
    }

    public function presignPut(string $contentType, string $objectKey): string
    {
        $command = $this->client()->getCommand('PutObject', [
            'Bucket' => config('r2.bucket'),
            'Key' => $objectKey,
        ]);

        return (string) $this->client()
            ->createPresignedRequest($command, config('r2.presign_ttl').' seconds')
            ->getUri();
    }

    public function presignGet(string $objectKey, ?string $fileName = null): string
    {
        $params = [
            'Bucket' => config('r2.bucket'),
            'Key' => $objectKey,
        ];

        // Paksa browser mengunduh (bukan menampilkan) dengan nama file benar —
        // atribut download pada <a> diabaikan browser untuk URL lintas origin.
        if ($fileName) {
            $safeName = str_replace(['"', "\r", "\n"], '', $fileName);
            $params['ResponseContentDisposition'] =
                'attachment; filename="'.$safeName.'"; filename*=UTF-8\'\''.rawurlencode($fileName);
        }

        $command = $this->client()->getCommand('GetObject', $params);

        return (string) $this->client()
            ->createPresignedRequest($command, config('r2.presign_ttl').' seconds')
            ->getUri();
    }

    /** Uji akses bucket — melempar exception bila kredensial/bucket salah. */
    public function assertBucketAccessible(): void
    {
        $this->client()->listObjectsV2([
            'Bucket' => config('r2.bucket'),
            'MaxKeys' => 1,
        ]);
    }

    public function deleteObject(string $objectKey): void
    {
        $this->client()->deleteObject([
            'Bucket' => config('r2.bucket'),
            'Key' => $objectKey,
        ]);
    }

    /** Terapkan CORS policy ke bucket (butuh token Admin Read & Write). */
    public function putCorsPolicy(array $policy): void
    {
        $this->client()->putBucketCors([
            'Bucket' => config('r2.bucket'),
            'CORSConfiguration' => ['CORSRules' => $policy],
        ]);
    }

    /** Baca CORS policy bucket (butuh token Admin Read). */
    public function getCorsPolicy(): array
    {
        $result = $this->client()->getBucketCors([
            'Bucket' => config('r2.bucket'),
        ]);

        return $result['CORSRules'] ?? [];
    }
}
