// 拡張機能のコンテンツスクリプトが読み込まれたことを示すフラグ
window.tldvTranscriptCopierLoaded = true;
console.log('tl;dv Transcript Copier: コンテンツスクリプトがロードされました');

// トランスクリプトの抽出とコピー処理
// chrome.runtimeとchrome.runtime.onMessageが存在するか確認してからリスナーを追加
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('メッセージを受信しました:', request);
    
    if (request.action === "copyTranscript") {
      try {
        const transcriptText = extractTranscript();
        if (transcriptText) {
          copyToClipboard(transcriptText)
            .then(() => {
              // 抽出結果をページに表示する
              displayTranscriptInPage(transcriptText);
              console.log('コピー成功、レスポンス送信');
              sendResponse({success: true, transcript: transcriptText});
            })
            .catch(err => {
              console.error('クリップボードへのコピーに失敗しました: ', err);
              sendResponse({success: false, message: "クリップボードへのコピーに失敗しました: " + err.message});
            });
        } else {
          console.log('トランスクリプトが見つかりませんでした');
          sendResponse({success: false, message: "トランスクリプトが見つかりませんでした"});
        }
      } catch (error) {
        console.error('処理中にエラーが発生しました:', error);
        sendResponse({success: false, message: "処理中にエラーが発生しました: " + error.message});
      }
      return true; // 非同期レスポンスのために必要
    }
    
    // デバッグ用：拡張機能の生存確認
    if (request.action === "ping") {
      console.log('Ping received');
      sendResponse({status: "alive"});
      return true;
    }
  });
} else {
  console.warn('chrome.runtime API または onMessage イベントが利用できません。この環境では拡張機能の機能が制限されます。');
}

// URLを検知して自動処理を行う機能
function checkURLAndAutoProcess() {
  const currentURL = window.location.href;
  // 指定のURLパターンにマッチするか確認（transcript=trueとvideo=trueを含むtldv.io/app/meetingsのURL）
  if (currentURL.includes('tldv.io/app/meetings') && 
      (currentURL.includes('transcript=true') || 
       currentURL.includes('transcript')) && 
      (currentURL.includes('video=true') || 
       currentURL.includes('video'))) {
    
    console.log('対象URLを検知しました。自動処理を開始します: ' + currentURL);
    
    // ページの読み込みが完了しているか確認するため段階的に複数回試行する
    // DOM要素が確実に揃うまで待つ
    let retryCount = 0;
    const maxRetries = 5;
    const checkAndProcess = () => {
      if (retryCount >= maxRetries) {
        console.error(`トランスクリプトの自動抽出に失敗しました（${maxRetries}回試行）`);
        return;
      }
      
      retryCount++;
      const transcriptText = extractTranscript();
      
      if (transcriptText) {
        // トランスクリプトを表示
        displayTranscriptInPage(transcriptText);
        console.log(`トランスクリプトを自動表示しました（${retryCount}回目の試行で成功）`);
      } else {
        console.log(`トランスクリプトの抽出に失敗、${retryCount}/${maxRetries}回目の試行`);
        // 待機時間を指数関数的に増加（1秒、2秒、4秒、8秒...）
        const waitTime = Math.min(2000 * Math.pow(2, retryCount - 1), 16000);
        setTimeout(checkAndProcess, waitTime);
      }
    };
    
    // 初回実行（少し待ってから）
    setTimeout(checkAndProcess, 1000);
  }
}

// イベントリスナーの登録と実行タイミングの調整
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: URL検知処理を実行します');
  checkURLAndAutoProcess();
});

window.addEventListener('load', () => {
  console.log('window.load: URL検知処理を実行します');
  checkURLAndAutoProcess();
});

// SPAでのナビゲーション検知（URL変更の監視）
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    console.log('URL変更を検知: ' + currentUrl);
    lastUrl = currentUrl;
    // URL変更時は少し待ってから処理を実行
    setTimeout(checkURLAndAutoProcess, 1000);
  }
});

// URL変更を検知するための監視設定
urlObserver.observe(document, {subtree: true, childList: true});

// 起動時にもチェック（拡張機能がページロード後に読み込まれた場合のため）
console.log('コンテンツスクリプト起動時にURL検知処理を実行');
setTimeout(checkURLAndAutoProcess, 500);

// 抽出したトランスクリプトをページに表示する関数
function displayTranscriptInPage(transcriptText) {
  try {
    // 指定されたセレクタの要素を取得
    const firstSelector = document.querySelector('#main > div.flex.flex-1.min-h-0.flex-col > div.group\\/meeting-page.flex.flex-col.h-full.w-full.gap-4.px-6.max-w-7xl.mx-auto > div.flex.flex-row.items-start.mt-4.gap-4');
    const secondSelector = document.querySelector('#main > div.flex.flex-1.min-h-0.flex-col > div.group\\/meeting-page.flex.flex-col.h-full.w-full.gap-4.px-6.max-w-7xl.mx-auto > div.flex.flex-1.gap-2.flex-row.min-h-0');
    
    if (!firstSelector || !secondSelector) {
      console.error('指定されたセレクタが見つかりませんでした');
      return;
    }
    
    // 既存の抽出結果表示要素があれば削除
    const existingTranscriptDisplay = document.getElementById('transcript-display-container');
    if (existingTranscriptDisplay) {
      existingTranscriptDisplay.remove();
    }
    
    // 新しい表示要素を作成
    const transcriptDisplayContainer = document.createElement('div');
    transcriptDisplayContainer.id = 'transcript-display-container';
    transcriptDisplayContainer.className = 'w-full mt-2 mb-4 border-2 border-gray-200 rounded-lg p-4 bg-white relative';
    transcriptDisplayContainer.style.overflowY = 'auto';
    transcriptDisplayContainer.style.maxHeight = '500px';
    
    // ヘッダー部分
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center mb-2 pb-2 border-b border-gray-200';
    
    const headerTitle = document.createElement('h3');
    headerTitle.className = 'text-lg font-semibold text-gray-700';
    headerTitle.textContent = '抽出結果';
    
    // アクションボタン領域
    const actionButtonsDiv = document.createElement('div');
    actionButtonsDiv.className = 'flex items-center gap-2';
    
    // コピーボタン (洗練されたデザイン)
    const copyButton = document.createElement('button');
    copyButton.className = 'text-white font-medium rounded-lg text-sm px-4 py-2 transition-all duration-200 border border-transparent flex items-center gap-2 shadow-sm';
    copyButton.style.color = 'white';
    copyButton.style.backgroundColor = '#3b82f6'; // bg-blue-500の色コード
    copyButton.style.transform = 'translateY(0)';
    copyButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>コピー';
    
    // ホバー効果
    copyButton.onmouseover = () => {
      copyButton.style.backgroundColor = '#2563eb'; // bg-blue-600
      copyButton.style.transform = 'translateY(-1px)';
      copyButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.12)';
    };
    
    copyButton.onmouseout = () => {
      copyButton.style.backgroundColor = '#3b82f6'; // bg-blue-500
      copyButton.style.transform = 'translateY(0)';
      copyButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    };
    
    copyButton.onclick = () => {
      copyToClipboard(transcriptText)
        .then(() => {
          // コピー成功のフィードバック
          copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>コピー完了';
          copyButton.style.backgroundColor = '#22c55e'; // bg-green-500の色コード
          copyButton.onmouseover = () => {
            copyButton.style.backgroundColor = '#16a34a'; // bg-green-600
            copyButton.style.transform = 'translateY(-1px)';
            copyButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.12)';
          };
          
          copyButton.onmouseout = () => {
            copyButton.style.backgroundColor = '#22c55e'; // bg-green-500
            copyButton.style.transform = 'translateY(0)';
            copyButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          };
          
          setTimeout(() => {
            copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>コピー';
            copyButton.style.backgroundColor = '#3b82f6'; // bg-blue-500の色コード
            
            // マウスホバー効果を元に戻す
            copyButton.onmouseover = () => {
              copyButton.style.backgroundColor = '#2563eb'; // bg-blue-600
              copyButton.style.transform = 'translateY(-1px)';
              copyButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.12)';
            };
            
            copyButton.onmouseout = () => {
              copyButton.style.backgroundColor = '#3b82f6'; // bg-blue-500
              copyButton.style.transform = 'translateY(0)';
              copyButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            };
          }, 2000);
        })
        .catch(err => {
          console.error('コピーに失敗しました:', err);
          copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>コピー失敗';
          copyButton.style.backgroundColor = '#ef4444'; // bg-red-500の色コード
          
          copyButton.onmouseover = () => {
            copyButton.style.backgroundColor = '#dc2626'; // bg-red-600
            copyButton.style.transform = 'translateY(-1px)';
            copyButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.12)';
          };
          
          copyButton.onmouseout = () => {
            copyButton.style.backgroundColor = '#ef4444'; // bg-red-500
            copyButton.style.transform = 'translateY(0)';
            copyButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          };
          
          setTimeout(() => {
            copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>コピー';
            copyButton.style.backgroundColor = '#3b82f6'; // bg-blue-500の色コード
            
            // マウスホバー効果を元に戻す
            copyButton.onmouseover = () => {
              copyButton.style.backgroundColor = '#2563eb'; // bg-blue-600
              copyButton.style.transform = 'translateY(-1px)';
              copyButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.12)';
            };
            
            copyButton.onmouseout = () => {
              copyButton.style.backgroundColor = '#3b82f6'; // bg-blue-500
              copyButton.style.transform = 'translateY(0)';
              copyButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            };
          }, 2000);
        });
    };
    
    // 閉じるボタン
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700 ml-2';
    closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeButton.onclick = () => {
      transcriptDisplayContainer.remove();
    };
    
    // バツボタンの左に「コピーする」ボタンを配置（順序が重要）
    actionButtonsDiv.appendChild(copyButton);
    actionButtonsDiv.appendChild(closeButton);
    
    headerDiv.appendChild(headerTitle);
    headerDiv.appendChild(actionButtonsDiv);
    transcriptDisplayContainer.appendChild(headerDiv);
    
    // 本文部分（話者分離形式）
    const contentDiv = document.createElement('div');
    contentDiv.className = 'mt-4';
    
    // トランスクリプトを行ごとに分割して話者ごとにスタイルを適用
    const lines = transcriptText.split('\n');
    const speakers = new Set();
    const speakerColors = {};
    const colorPalette = [
      'rgb(239, 246, 255)', // 薄い青
      'rgb(254, 242, 242)', // 薄い赤
      'rgb(240, 253, 244)', // 薄い緑
      'rgb(254, 249, 195)', // 薄い黄色
      'rgb(243, 232, 255)', // 薄い紫
      'rgb(224, 242, 254)', // 薄い空色
      'rgb(255, 237, 213)', // 薄いオレンジ
    ];
    
    // 最初に話者の一覧を取得
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const speaker = line.substring(0, colonIndex).trim();
        speakers.add(speaker);
      }
    });
    
    // 話者ごとに色を割り当て
    Array.from(speakers).forEach((speaker, index) => {
      speakerColors[speaker] = colorPalette[index % colorPalette.length];
    });
    
    // 行ごとにHTMLを生成
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const speaker = line.substring(0, colonIndex).trim();
        const text = line.substring(colonIndex + 1).trim();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-3 p-3 rounded-lg';
        messageDiv.style.backgroundColor = speakerColors[speaker] || 'white';
        
        const speakerDiv = document.createElement('div');
        speakerDiv.className = 'font-semibold text-gray-800 mb-1';
        speakerDiv.textContent = speaker;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'text-gray-700';
        textDiv.textContent = text;
        
        messageDiv.appendChild(speakerDiv);
        messageDiv.appendChild(textDiv);
        contentDiv.appendChild(messageDiv);
      } else if (line.trim()) {
        // 話者情報がない場合はそのまま表示
        const textDiv = document.createElement('div');
        textDiv.className = 'mb-2 text-gray-700';
        textDiv.textContent = line;
        contentDiv.appendChild(textDiv);
      }
    });
    
    transcriptDisplayContainer.appendChild(contentDiv);
    
    // 指定場所に挿入
    firstSelector.parentNode.insertBefore(transcriptDisplayContainer, secondSelector);
    
    console.log('トランスクリプトをページに表示しました');
  } catch (error) {
    console.error('トランスクリプトの表示に失敗しました:', error);
  }
}

// Pythonスクリプトと同様の処理を行うJavaScript関数
function extractTranscript() {
  const paragraphs = document.querySelectorAll('p[data-index]');
  if (paragraphs.length === 0) {
    return null;
  }

  const transcripts = [];

  paragraphs.forEach(p => {
    // 話者名の取得
    const speakerSpan = p.querySelector('span[data-speaker="true"]');
    let speaker = "不明";
    
    if (speakerSpan) {
      // 話者名を含むspanを検索
      const speakerNameSpan = speakerSpan.querySelector('span');
      if (speakerNameSpan && speakerNameSpan.textContent) {
        speaker = speakerNameSpan.textContent.trim();
      }
    }

    // 発話テキストの取得
    const textSpans = p.querySelectorAll('span[data-speaker="false"]');
    const texts = Array.from(textSpans).map(span => span.textContent || "");
    const text = texts.join("").trim();

    transcripts.push(`${speaker}: ${text}`);
  });

  return transcripts.join('\n');
}

// クリップボードにテキストをコピーする関数（Promiseを返すように変更）
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    // 方法1: Navigator Clipboard API（権限が必要）
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          console.log('クリップボードにコピーしました（Navigator API）');
          resolve();
        })
        .catch(err => {
          console.warn('Navigator Clipboard APIが失敗しました。代替方法を試します: ', err);
          
          try {
            // 方法2: execCommand方式（古い方法だが広くサポートされている）
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';  // スクロールされないように
            textArea.style.opacity = '0';       // 非表示に
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            if (successful) {
              console.log('クリップボードにコピーしました（execCommand）');
              resolve();
            } else {
              reject(new Error('execCommandによるコピーに失敗しました'));
            }
            document.body.removeChild(textArea);
          } catch (execError) {
            reject(execError);
          }
        });
    } else {
      // Navigator Clipboard APIが利用できない場合は直接方法2を試みる
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (successful) {
          console.log('クリップボードにコピーしました（execCommand）');
          resolve();
        } else {
          reject(new Error('execCommandによるコピーに失敗しました'));
        }
        document.body.removeChild(textArea);
      } catch (execError) {
        reject(execError);
      }
    }
  });
} 