# tl;dv Transcript Copier

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

tl;dvのトランスクリプトをワンクリックでコピーできるChrome拡張機能です。ミーティングの文字起こしを簡単にコピーして別の場所で活用できます。

<img src="icons/icon128.png" alt="tl;dv Transcript Copier ロゴ" width="128" align="right"/>

## 機能

- tl;dvページで表示されているトランスクリプトを簡単にコピー
- 「話者名: テキスト」形式でフォーマット済みのトランスクリプトを取得
- ページ内トランスクリプト表示機能（コピーせずに閲覧可能）
- 話者ごとに色分けされた表示で可読性を向上
- 特定のURLパターン（`transcript`と`video`パラメータを含むURL）で自動的にトランスクリプトを表示
- フローティングコピーボタンで長いトランスクリプトも簡単にコピー


## インストール方法

### 開発版をインストール

1. このリポジトリをクローンまたはダウンロード
   ```
   git clone https://github.com/yourusername/tldv-transcript-copier.git
   ```
2. Chromeで `chrome://extensions` を開く
3. 右上の「デベロッパーモード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、ダウンロードしたフォルダを選択


## 使用方法

### 基本的な使い方

1. tl;dvのミーティングページにアクセス
2. 「トランスクリプト」をオンにして表示
3. 以下のいずれかの方法でトランスクリプトをコピー：
   - 拡張機能のアイコンをクリックし、表示されたポップアップの「トランスクリプトをコピー」ボタンをクリック
   - ページに表示される青色コピーボタンをクリック
   - 画面右下に表示されるフローティングコピーボタンをクリック
4. クリップボードにコピーされたトランスクリプトを任意の場所に貼り付け

### 自動検出機能

以下のURLパターンを含むページでは、自動的にトランスクリプトが検出され表示されます：
- `https://tldv.io/app/meetings/...?transcript=true&video=true`
- `https://tldv.io/app/meetings/...?transcript&video`

この機能により、ページを開くだけで自動的にトランスクリプトを表示できます。

## 技術スタック

- JavaScript (ES6+)
- Chrome Extension API
- HTML5 / CSS3 (Tailwind CSSスタイルを採用)

## 技術的詳細

この拡張機能は以下のような仕組みで動作します：

- DOM操作: tl;dvページ内のdata-index属性を持つp要素からトランスクリプトを抽出
- 話者検出: HTML構造を解析して話者と発言内容を識別
- クリップボード操作: Navigator Clipboard API（フォールバックとしてdocument.execCommand）
- URL検知: URLパターンに基づく自動トランスクリプト表示
- SPA対応: MutationObserverによるページ変更の検知

## 開発環境のセットアップ

1. リポジトリをクローン
   ```
   git clone https://github.com/yourusername/tldv-transcript-copier.git
   cd tldv-transcript-copier
   ```

2. Chrome拡張機能として読み込む
   - Chromeで `chrome://extensions` を開く
   - デベロッパーモードをオン
   - 「パッケージ化されていない拡張機能を読み込む」で開発フォルダを選択

3. 開発とデバッグ
   - ファイルを編集後、拡張機能ページの更新ボタンをクリック
   - Chromeのデベロッパーツールでデバッグ（拡張機能のバックグラウンドページやコンテンツスクリプトを検査）

## コントリビューション

コントリビューションを歓迎します！以下の手順で貢献できます：

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

### コーディング規約

- インデントはスペース2つ
- セミコロンは必須
- 変数名・関数名はキャメルケース

## トラブルシューティング

**Q: トランスクリプトがコピーされません**  
A: 以下を確認してください：
- tl;dvのページにトランスクリプトが表示されているか
- ブラウザのクリップボードアクセス権限が許可されているか
- 拡張機能が最新バージョンか

**Q: 拡張機能のアイコンをクリックしても何も起きません**  
A: 拡張機能を一度無効にしてから再度有効にしてみてください。

## 更新履歴

### v1.1.0 (2025-05-05)
- 初回リリース
- 基本的なトランスクリプトコピー機能
- ポップアップインターフェース

### v1.2.0 (2025-05-06)
- ページ内トランスクリプト表示機能を追加
- 話者ごとの色分け表示
- フローティングコピーボタン
- URL自動検知機能

## ライセンス

MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 謝辞

- すべてのコントリビューターに感謝します。