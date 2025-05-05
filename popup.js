document.addEventListener('DOMContentLoaded', function() {
  const copyButton = document.getElementById('copyButton');
  const statusDiv = document.getElementById('status');
  const transcriptContainer = document.getElementById('transcriptContainer');

  copyButton.addEventListener('click', function() {
    // 処理中表示
    statusDiv.textContent = '処理中...';
    statusDiv.style.color = 'blue';
    copyButton.disabled = true;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0] || !tabs[0].url || !tabs[0].url.includes('tldv.io')) {
        statusDiv.textContent = 'tl;dvのページを開いてください';
        statusDiv.style.color = 'red';
        transcriptContainer.style.display = 'none';
        copyButton.disabled = false;
        return;
      }

      // content_scriptが確実にロードされているか確認
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          return true; // content_scriptが実行可能かチェック
        }
      }).then(() => {
        // content_scriptが実行可能なら、メッセージを送信
        chrome.tabs.sendMessage(tabs[0].id, {action: "copyTranscript"}, function(response) {
          copyButton.disabled = false;

          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            statusDiv.textContent = 'エラーが発生しました: ' + chrome.runtime.lastError.message;
            statusDiv.style.color = 'red';
            transcriptContainer.style.display = 'none';
            
            // content_scriptの再注入を試みる
            retryContentScriptInjection(tabs[0].id, function() {
              statusDiv.textContent = 'もう一度試してください';
            });
          } else if (response && response.success) {
            statusDiv.textContent = 'トランスクリプトをコピーしました！';
            statusDiv.style.color = 'green';
            
            // トランスクリプトを表示
            transcriptContainer.textContent = response.transcript;
            transcriptContainer.style.display = 'block';
            
            // 視覚的フィードバック
            copyButton.textContent = 'コピー完了！✓';
            setTimeout(() => {
              copyButton.textContent = 'トランスクリプトをコピー';
            }, 2000);
          } else {
            // エラーメッセージを表示
            const errorMsg = response ? response.message : 'トランスクリプトが見つかりませんでした';
            statusDiv.textContent = errorMsg;
            statusDiv.style.color = 'red';
            transcriptContainer.style.display = 'none';
          }
        });
      }).catch(err => {
        console.error('スクリプト実行エラー:', err);
        statusDiv.textContent = 'ページとの通信に失敗しました。ページを再読み込みしてください。';
        statusDiv.style.color = 'red';
        copyButton.disabled = false;
      });
    });
  });
  
  // content_scriptを再注入する関数
  function retryContentScriptInjection(tabId, callback) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).then(() => {
      console.log('content.jsを再注入しました');
      if (callback) callback();
    }).catch(err => {
      console.error('content.jsの再注入に失敗しました:', err);
    });
  }
}); 