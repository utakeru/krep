const enableUrl = (urlString: string): boolean => {
    const url = new URL(urlString);
    const path = url.href.replace(url.origin, "");
    const enableUrlPatterns = [
      /^\/k\/#\/people\/user\/.+/, // ピープル
      /^\/k\/#\/space\/[0-9]+\/thread\/.+/, // スレッド
      /^\/k\/guest\/[0-9]+\/#\/space\/[0-9]+\/thread\/[0-9]+/, // ゲストスペースのスレッド
      /^\/k\/#\/ntf\/.+\/k\/space\/.+/, // 通知画面のスレッド（ドメイン、ゲスト）
      /^\/k\/#\/ntf\/.+\/k\/people\/.+/, // 通知画面のピープル
    ];
    return enableUrlPatterns.some((pattern) => pattern.test(path));
}

export { enableUrl }