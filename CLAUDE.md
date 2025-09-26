# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## banner-generator - OGPバナー自動生成サーバー

### 概要

URLから背景画像を取得し、テキストを載せた画像を自動生成するNode.jsベースのWebアプリケーション。ブラウザやフォントレンダリングエンジンを使用せず、純粋なNode.jsとSharpライブラリで画像処理を行う軽量な実装。

**主な機能:**
- URLパラメータで指定した背景画像とテキストからバナー画像を生成
- テキスト数に応じた自動レイアウト調整（1〜3行）
- フォントサイズの自動調整（minWidth/maxWidth指定）
- オーバーレイカラーによる背景調整

### 開発コマンド

```bash
# ビルド (TypeScriptコンパイル)
yarn build
# または
npm run build

# 開発サーバーの起動
yarn server
# または
npm run server

# テスト実行 (ビルド + lint + prettier + unit tests)
yarn test
# または
npm run test

# コード修正 (prettier + eslint)
yarn fix
# または
npm run fix

# adhocスクリプト実行
yarn adhoc
# または
npm run adhoc
```

**環境変数:**
- `PORT` - サーバーポート (デフォルト: 3000)
- `HOST` - バインドホスト (デフォルト: 0.0.0.0)

### アーキテクチャと技術スタック

**主要技術:**
- Node.js 22 (ES modules)
- TypeScript 5.6+
- Fastify 5.0 (高速HTTPサーバー)
- Sharp 0.33+ (画像処理)
- text-to-svg 3.1+ (SVGテキスト生成)
- Pino (構造化ロギング)

**画像処理の仕組み:**
1. 背景画像をHTTPで取得してSharpで読み込み
2. テキストをtext-to-svgでSVGに変換
3. SVGをSharpのオーバーレイ機能で背景に合成
4. JPEG形式で出力

### プロジェクト構造

**コア実装:**
- `/src/server.ts` - Fastifyサーバーとエンドポイント定義
- `/src/banners/type-a.ts` - type-aバナー生成ロジック (BannerTypeA namespace)
- `/src/text.ts` - テキストレイアウト計算とSVG生成 (1行/2行/3行の配置関数)
- `/src/types.ts` - 型定義とScale値パーサー
- `/src/dependency.ts` - 依存性注入 (logger、HTTP client)

**テキストレイアウトロジック:**
- `placeOneSvgText()` - 1行: 中央配置
- `placeTwoSvgTexts()` - 2行: タイトル+サブタイトルとして中央配置、lineGapで間隔調整
- `placeThreeSvgTexts()` - 3行: paddingTop/paddingBottomで上下余白を設定し、残りのスペースで均等配置

### API仕様

**エンドポイント:** `GET /banners/type-a`

**基本パラメータ:**
- `bgUrl` - 背景画像URL (必須)
- `overlayColor` - オーバーレイカラー (例: `#00000080` で半透明黒)
- `paddingTop` - 上余白 (3行表示時、ピクセルまたは%)
- `paddingBottom` - 下余白 (3行表示時、ピクセルまたは%)
- `lineGap` - 行間隔 (2行表示時、ピクセルまたは%)

**テキスト指定 (省略記法):**
- `text0` = `texts[0].content`
- `text0width` = `texts[0].minWidth`と`texts[0].maxWidth`をまとめて設定
- `text1`, `text1width` - 2行目
- `text2`, `text2width` - 3行目

**詳細カスタマイズ:**
- `merge` - JSON形式でspecをまとめて上書き
- `キーパス` - dot記法で個別プロパティを上書き (例: `texts[0].fontSize=25%`)

**利用可能なフォント:**
- `NotoSansJP-Black` - 極太
- `NotoSansJP-Bold` - 太字
- `NotoSansJP-Medium` - 中太

フォントファイルは `/fonts/` ディレクトリに配置 (.otf形式)

### Prettier設定

- シングルクォート使用
- セミコロンなし
- 行幅120文字

### Docker対応

DockerイメージがDocker Hubで公開されている: `ideamans/banner-generator`

ビルド時に `yarn test` が実行され、テスト失敗時はビルドが中断される。