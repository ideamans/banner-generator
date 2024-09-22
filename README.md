# OGPバナーを自動生成するサーバー

指定のURLから背景画像を取得し、テキストを載せた画像を生成します。

<https://notes.ideamans.com/> のOGP画像として開発したWebアプリケーションですが、柔軟なカスタマイズが可能で汎用性があります。

ブラウザやフォントを必要とせず、純粋なNode.JSのみで軽快に動作します。

## 使い方

```bash
yarn
yarn build
yarn serve
```

次のURLにアクセスすると画像が表示されます。

<http://localhost:3000/banners/type-a?bgUrl=https%3A%2F%2Fnotes.ideamans.com%2Fogp-background.jpg&text0=ideaman%27s+Notes&text0width=70%25&text1=%E3%82%A2%E3%82%A4%E3%83%87%E3%82%A2%E3%83%9E%E3%83%B3%E3%82%BA%E6%A0%AA%E5%BC%8F%E4%BC%9A%E7%A4%BE%E3%81%AE%E7%A0%94%E7%A9%B6%E3%83%8E%E3%83%BC%E3%83%88&text1width=70%25>

![バナー画像の例](./readme/type-a.jpg)

## API

- エンドポイント '<http://localhost:3000/banners/type-a>'
  - バナーの種類に応じて追加予定
- パラメータ
  - `bgUrl` 背景画像のURL(必須)
  - `text0` 1行目のテキスト
  - `text0width` 1行目のテキストの幅
  - `text1` 2行目のテキスト
  - `text1width` 2行目のテキストの幅
  - `text2` 3行目のテキスト
  - `text2width` 3行目のテキストの幅
  - `spec` JSON形式によるバナーの詳細仕様上書き
  - `キーパス` バナーの詳細仕様の個別上書き

## テキスト数による配置

指定したテキストの数によって配置が変わります。

### テキストが1行のみの場合

中央に配置します。

![1行のみの場合](./readme/one-text.jpg)

### テキストが2行の場合

タイトルとサブタイトルとして中央に配置します。

![2行の場合](./readme/two-texts.jpg)

### テキストが3行の場合

OGPバナー風に縦方向に均等に配置します。

![3行の場合](./readme/three-texts.jpg)

## 詳細な仕様

バナーの詳細仕様とそのデフォルト値です。

```js
{
      bgUrl: '', // 背景画像のURL(必須)
      paddingY: '15%', // 3行表示の際の上下余白(ピクセル数または背景画像の高さに対する%)
      lineGap: '5%', // 2行表示の際の行間(ピクセル数または背景画像の高さに対する%)
      texts: [
        {
          content: ``, // 1行目のテキスト
          fontSize: '20%', // 1行目のフォントサイズ(ピクセル数または背景画像の幅に対する%)
          fillColor: 'white', // 1行目の色
          minWidth: '60%', // 1行目の最大幅(ピクセル数または背景画像の幅に対する%)
          maxWidth: '60%', // 1行目の最小幅(ピクセル数または背景画像の幅に対する%)
          letterSpacing: 0, // 1行目の文字間隔(em)
          fontFace: 'NotoSansJP-Black', // 1行目のフォント
        },
        { // 2行目
          content: ``,
          fontSize: '10%',
          fillColor: 'white',
          minWidth: '50%',
          maxWidth: '90%',
          letterSpacing: 0,
          fontFace: 'NotoSansJP-Bold',
        },
        { // 3行目
          content: ``,
          fontSize: '5%',
          fillColor: 'white',
          minWidth: '40%',
          maxWidth: '40%',
          letterSpacing: 0,
          fontFace: 'NotoSansJP-Medium',
        },
      ],
    }
```

### フォント

次の3つから選択できます。

- NotoSansJP-Medium
- NotoSansJP-Bold
- NotoSansJP-Black

### パラメータによる上書き方法

上記のデフォルト値に対し、カスタマイズしたい値を上書きします。

上書きには3種類の方法があります。

#### `spec`パラメータ

`spec`パラメータにJSONオブジェクトを渡すと、まとめて上書きできます。

```txt
// 実際は値をURLエンコード
spec={"paddingY": "20%","texts": [{"content": "1行目","maxWidth": "90%"}]}
```

#### `キーパス`パラメータ

`キーパス`をパラメータ名に指定すると1つずつ上書きできます。

```txt
// 実際はパラメータ名と値をURLエンコード
texts[0].maxWidth=90%
```

#### 特別な省略記法

`text0`は`texts[0].content`の省略記法です。

また、`text0width`は`texts[0].maxWidth`と`text[0].minWidth`をまとめて設定する省略記法です。

## dockerイメージ

次のDockerイメージも公開しています。

<https://hub.docker.com/repository/docker/ideamans/banner-generator/general>
