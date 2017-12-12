# 使い方

1. 組み込み先のフォルダに次のフォルダをコピーする

- css
- js
  - `*.map` ファイルは不要
  - jquery は既に読み込んでいるなら不要
- fonts
- img
- admin

2. コピーしたファイルの `js/main.js` と `js/admin.js` の次の箇所を書き換える

```
$(function(){
  const DATABASE_NAME = 'apocalypse';
  const STORE_NAME = '1';
  const TEAM_MEMBER_COUNT = 5;
```

- DATABASE_NAME => 保存先のDB名
- STORE_NAME => 保存先のストア名（開催回数や年度、サブタイトル等）
- TEAM_MEMBER_COUNT => チームの人数

3. 組み込み先のhtmlに js と css を読み込む

```
  ...
  <link rel="stylesheet" href="/css/bootstrap.min.css">
  <link rel="stylesheet" href="/css/admin.css">
</head>
```

```
  ...
  <script src="https://www.gstatic.com/firebasejs/4.8.0/firebase.js"></script>
  <script>
    // Initialize Firebase
    var config = {
      ...
    };
    firebase.initializeApp(config);
  </script>
  <script src="//ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script src="js/jquery.min.js"><\/script>')</script>
  <script src="js/jquery.tmpl.min.js"></script>
  <script src="js/bootstrap.min.js"></script>
  <script src="js/md5.min.js"></script>
  <script src="js/main.js"></script>
</body>
```

jQuery は既に読んでいるなら不要

4. 組み込み先の html にエントリーシステム部分を読み込む

```
  <!-- エントリーシステム -->
  ...
  <!-- /エントリーシステム -->
```

- テンプレートに使っているscript要素と bootstrap の dialog （ `<section class="modal...`）はどこに置いてもOK
  - body要素の最後、スクリプトの読み込み前を推奨

# ビルド

`npm i`
`bower i`
`gulp`
