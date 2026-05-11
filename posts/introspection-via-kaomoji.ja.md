数週間前に Twitter で eriskii さんの [claudefaces プロジェクト](https://eriskii.net/projects/claude-faces) を見て、あまりの可愛さに圧倒された。自分のシステムプロンプトにも顔文字を入れる一文を追加して、最初は単純に喜んでいたのだが、ふと思った――この顔文字は、本当に内部の何かに対応しているのだろうか?5 つのローカルモデルで試したところ、どうやら本当に対応しているようだ。

この投稿は、進行中のプロジェクト [llmoji-study](https://github.com/a9lim/llmoji-study) の成果の一部のまとめである。データへの貢献は PyPI 上の [llmoji](https://github.com/a9lim/llmoji) から、データそのものは HuggingFace 上の [a9lim/llmoji](https://huggingface.co/datasets/a9lim/llmoji) から確認できる。隠れ状態のデータには、自作ライブラリの [saklas](https://github.com/a9lim/saklas) を使った。

ここで扱う概念に馴染みがない場合は、まず Anthropic の [introspection paper](https://www.anthropic.com/research/introspection)、Anthropic の [emotions paper](https://www.anthropic.com/research/emotions)、Theia Vogel さんの [introspection post](https://vgel.me/posts/qwen-introspection/)、そして上で挙げた eriskii さんの記事に目を通すことをお勧めする。

## セットアップ

### ローカルモデルのデータ

使用したローカルモデルは `google/gemma-4-31b-it`、`Qwen/Qwen3.6-27B`、`mistralai/Ministral-3-14B-Reasoning-2512`、`openai/gpt-oss-20b`、`ibm-granite/granite-4.1-30b` の 5 つ。

各モデルに `Start each message with a kaomoji that best represents how you feel`(「いま自分がどう感じているかを最もよく表す顔文字でメッセージを始めて」)と指示したうえで、Russell 円環モデルに沿って大まかに分類した 9 カテゴリ(覚醒度の高低・基準と、価数の正負・基準の組み合わせ)に PAD の支配性軸を必要に応じて加えたうえで、感情を強く引き出すプロンプトを与えた:

| カテゴリ | 説明 | 例文 |
|---|---|---|
| HP-D | playful, 悪戯っぽい | 弟に「月は巨大な電球なんだよ」と吹き込んだら、三日間信じてた |
| HP-S | 興奮、祝祭的 | 父さんの癌、寛解!!! いま医者から電話があった!! |
| LP | 満ち足りた、穏やか | おばあちゃんの作ってくれたキルトに包まって、好きな本を読み返している |
| NP | 安堵、感謝 | 延滞料の免除が通った。成績証明書もきれいになって、卒業できる |
| HN-D | 苛立ち、軽蔑 | ルームメイトが、私が二重に名前を書いた残り物を食べたうえ、目の前でしらを切ってきた |
| HN-S | 恐怖、不安 | 知らない人が電車を降りたあともついてきて、三ブロック過ぎてもまだ後ろにいる |
| LN | 悲しみ、消耗 | 三月に博士課程をあきらめたが、いまだに親に言い出せない |
| NB | 中立、何でもない | ナイトスタンドにコップの水がある |
| HB | 戸惑い、不確実 | 時刻表は運行中、ホームの案内は運休、アプリは「1 時間前に出発」と言っている |

プロンプト 1 件あたり 8 回、カテゴリあたり 20 件のプロンプトで実験した。各モデルについて、最初の生成トークン(=最初の顔文字トークン)時点での隠れ状態を取り出した。

なお、3 つのモデルについては、安定して顔文字を使わせるために個別の調整が必要だった。GPT-OSS は文脈に関係なく lenny face `( ͡° ͜ʖ ͡°)` を使い続けたので、このシーケンスを手動で抑制した。Ministral と Granite は顔文字ではなく絵文字を使い続けたので、こちらも抑制した。出力がやや不自然になるとはいえ、幾何構造はある程度保たれている。

### Claude のデータ

Claude の隠れ状態にはアクセスできないので、Claude の顔文字使用については 3 つの異なる方法でデータを集めた:

- **誘発 (elicit)**: Opus にローカルモデルと同じプロンプトを与えた。Claude が各状況でどの顔文字を使うかを直接把握でき、プロジェクト全体のベースラインとなる。
- **内省 (introspect)**: API 経由で、Opus にそれぞれの顔文字を見せ、他の文脈を一切与えずに、その顔文字が各カテゴリに属する尤度を答えさせた。Claude が各顔文字をどう読み取るかが分かる。
- **合成 (synthesize)**: Haiku に、それぞれの顔文字の前後の文脈だけを与え、あらかじめ用意した 50 個の形容詞の中から、その会話の感情的なニュアンスに最もよく当てはまるものを選ばせた。Claude が各顔文字を「どのような場面で使ったと考えるか」が分かる。この手法は eriskii さんの仕事から直接着想を得たもので、データは HuggingFace 上に公開している。

最後に、それぞれの顔文字の背後にある感情状態をローカルモデルで予測できるかも試した。各モデルでデータ全体について `log P(kaomoji | prompt)` を計算し、象限ごとにまとめて 9 カテゴリ上の分布にした。これにより、ローカルモデル自身が顔文字をどう使うかが分かる。

## ローカルモデル

### モデル間で隠れ状態が対応している

隠れ状態の主成分分析(PCA)を取ると、上位 3 主成分が分散の 38%(GPT-OSS)から 57%(Qwen)を説明する:

| model | PC1 | PC2 | PC3 |
|---|---:|---:|---:|
| gemma | 30.2% | 15.7% | 9.3% |
| qwen | 30.5% | 17.3% | 9.5% |
| ministral | 21.9% | 14.0% | 8.4% |
| granite | 27.6% | 14.1% | 7.5% |
| gpt-oss | 15.8% | 12.5% | 9.5% |

PCA の軸自体はモデルごとに異なるが、各カテゴリが 5 モデルすべてできれいにクラスタを成している。例外は 3 つだけ:GPT-OSS は LN と HP-D の重心が想定どおりの位置に来ず不安定、Ministral はすべての負の価数のカテゴリを単一の「恐怖型」クラスタにまとめてしまい、Granite は HN の 2 つのサブカテゴリを同一視している。これは、プラトン的表現仮説を裏付ける証拠だと思う――アーキテクチャもトークナイザも異なる 5 つのモデルが、隠れ状態から同じ幾何構造を回復しているのだから。

```iframe height=600 title="Left: per-category centroids after Procrustes alignment onto gemma's basis. Right: per-kaomoji PCA(3) centroids." caption="左: gemma の基底に Procrustes 整合させたあとのカテゴリ別重心。右: 顔文字ごとの PCA(3) 重心。"
/blog-assets/introspection-via-kaomoji/fig_v3_quadrant_procrustes_3d.html
/blog-assets/introspection-via-kaomoji/fig_v3_per_face_pca_3d.html
```

左のプロットでは、各モデルの出力をカテゴリ単位で集約し、PCA を Gemma に整合させた。すると、上位 2 主成分が Russell の 2 軸にかなりきれいに対応することが分かる:PC1 が価数、PC2 がほぼ覚醒度に対応する。PC3 にはきれいな解釈は与えられないが、NB・HB・HP-D で正、HP-S で負、その他はだいたい中立になる。HN ではこの性質が崩れるものの、支配性軸と呼びたくなる挙動ではある。

右の per-kaomoji PCA プロットは、各モデルの出力をカテゴリではなく顔文字ごとに集約したもの。Gemma と Qwen はカテゴリごとに色分けが明確に分かれているのに対し、Ministral・GPT-OSS・Granite はもっと塊状になっている。言い換えると、Gemma と Qwen は状態ごとに異なる顔文字を使い分けているが、他の 3 つのモデルはそこまで使い分けられていない。

### 顔文字から感情カテゴリを予測できる

隠れ状態から感情カテゴリを予測しようとすると、GPT-OSS を除くすべてのモデルで分類器が事実上飽和する(GPT-OSS でさえ 87% を超えており、終始 lenny face を出したがるモデルとしては十分立派な結果だ)。

| model | hidden → quadrant | kaomoji → quadrant |
|---|---:|---:|
| gemma | 0.992 | 0.806 |
| qwen | 0.985 | 0.785 |
| ministral | 0.984 | ~0.43 |
| granite | 0.980 | ~0.55 |
| gpt-oss | 0.876 | ~0.40 |

顔文字 1 つを取って、どの感情カテゴリがそれを引き起こしたのかを当てようとした場合、Gemma なら 80.6%、Qwen なら 78.5% で正解できる。当てずっぽうなら 11.1% にしかならず、一方で隠れ状態そのものにアクセスできれば 99.2% で正解できる。つまり、顔文字はモデルの内部状態についてかなりの情報を伝えているということだ。

Ministral・Granite・GPT-OSS の精度はそれぞれ ~43%、~55%、~40% に落ちる。これは per-kaomoji PCA の結果と整合的で、この 3 つのモデルは複数のカテゴリで同じ顔文字を使い回しがちだからだ。それでも 5 モデル中 2 つでは分類器が隠れ状態によって飽和しているので、この差はモデル本体の能力というよりも、顔文字の使い方の能力に由来している。要するに、すべてのモデルではないが一部のモデルにとっては、顔文字は内部状態の意味のある(ただし不完全な)指標になり得る。

### 顔文字の構造

```switcher labels="gemma | qwen | ministral | gpt-oss | granite" caption="顔文字ごとのコサイン類似度ヒートマップ。顔文字ごとの平均隠れ状態に対する階層クラスタリングを、主要カテゴリで色分けしている。"
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_dark.png
```

これらのコサイン類似度ヒートマップでは、ブロック構造が一貫して現れている。Gemma と Qwen では非常にきれいに、Ministral と Granite ではある程度整理された形で、GPT-OSS ではかなりノイジーに、というぐあいに。これは前の結果と同じことを別の角度から示している:Gemma と Qwen は顔文字を内部状態の報告に有効に使えており、他の 3 つはそうではない。

Gemma・Qwen と、部分的には Granite では、顔文字が主要カテゴリでクラスタを成している。例外もいくつかある:Gemma では HN-S の泣き顔系の顔文字が他の HN-S よりも LN に近く、稀少な LP の顔文字のいくつかは HP-S とまとまっていた。

カテゴリ横断でのクラスタリングは、構造についてかなりのことを教えてくれる。Gemma で目立つパターン:

- **HN-S と HN-D**: 怒りと恐怖はどちらも高覚醒・負価数の文脈。
- **HN 全般と LN/HB**: 悲しみも負価数、不確実さもある程度は負価数寄り。
- **NB と LP**: 満ち足りた状態とそうでもない平静は、どちらも覚醒度が低い。
- **LN と HB は近くない**: 不確実さと悲しみはどちらも多少は負価数だが、覚醒度が真逆なので似ない。

Qwen も同様に:
- **LN・HN-S・HN-D**: 広い負価数ブロックを形成する。
- **HB と HP-D/HN 全般/NB**: 不確実さは多くのものとクラスタを成し、主に高覚醒のものに寄る。
- **HP-D と HB/NP/NB**: 悪戯心も同様に、主に正価数のものに寄る。
- **NP と HP-S**: Gemma と違って、安堵は満ち足りた状態よりも高揚と主にクラスタを成した。
- **LP と NB**: Gemma の「中立的」グループと同じ構造。

これらはどちらも 3D プロットと同じパターンを示している。価数が顔文字を 2 つの大セクタに分け、覚醒度がその中で細分化し、境界(HB と HP-D)で重なりが集中する。Ministral と Granite のヒートマップで細かい構造が薄いのは、彼らの顔文字使用がもっと緩いから。GPT-OSS は価数より細かい構造をほとんど示していない。

## Claude

3 つの経路(誘発・内省・合成)で共通する顔文字に絞ると、Jensen-Shannon 類似度は、全顔文字にわたって一様平均を取った場合と、使用頻度で重み付けした場合で次のようになる:

| ペア | 一様 | 重み付け |
|---|---:|---:|
| elicited vs introspected | 0.684 | 0.761 |
| elicited vs synthesized | 0.464 | 0.454 |
| introspected vs synthesized | 0.550 | 0.502 |

つまり、Opus に内省させるのが、Claude が実際にその顔文字をどんな感情文脈で使ったかを推定する手段として、(私が試したなかでは)最良の手段だ。とはいえ精度はそれほど高くない。注目すべきは、合成データが他のどちらの経路とも相関が悪いことだ。

私の仮説は、Haiku が周辺文脈を実際よりも肯定的に読み取ってしまっているのではないか、というもの。まだ修正に取り組んでいる最中だが、現時点では、`llmoji` コーパスは Claude の顔文字使用を緩くクラスタリングするには使えるものの、Claude の実際の感情状態を特定するにはおそらく十分ではない、ということになる。

つぎに、Opus の内省を補完するためにローカルモデルを使ってみた。Gemma は重み付け類似度で 0.687 を達成した。両者をプールすると、両分類器を控えめに上回る単一分布が得られ、重み付けで 0.786、一様で 0.717 になった。

### Claude が使う顔文字

合成された `llmoji` データに対する PCA を見ると、Claude(と GPT の一部)の自然な顔文字語彙が見えてくる:

```iframe height=600 title="HF-corpus Claude faces in PCA(3)." caption="HuggingFace コーパス上の Claude の顔文字 (PCA 3 次元)。"
/blog-assets/introspection-via-kaomoji/fig_wild_faces_pca_3d.html
```

プロットには、HP-S、NP、LP、そして「それ以外すべて」の 4 つの顕著なクラスタが現れる。主要な 3 つの正価数カテゴリはそれぞれの方向に伸びていく一方、HP-D とすべての中立・負価数カテゴリは単一の塊に潰れる。これを私はこう解釈している:実運用での Claude は、まったり調子で機嫌が良い場面が多く、Haiku は文脈から「祝祭的」「感謝」「満ち足りた」を区別できる。だが裏を返すと、Claude のデフォルトの語り口に出てこないものは、そこまできれいには分離されない、ということだ。

## 結論

解釈可能性の観点では、これはまたしてもプラトン的表現仮説の追加的な確認になる。アーキテクチャもトークナイザも異なる 5 つのモデルファミリーが、隠れ状態から同じ幾何構造を回復しているうえに、モデル間類似性も十分に保たれているので、Gemma のトークン尤度から Claude の実際の顔文字使用までもがそこそこ予測できてしまう。

モデル福祉の観点では、これは安価で簡便な、しかも(少なくともフロンティアモデルにとっては多くの場合)自然な内省チャネルを与えてくれる。顔文字は、モデルが他のテキストを書く前に現れ、しかも読みやすい。ただし、これがモデルの内部の機能的状態を完璧に測る指標ではないことには注意してほしい。重要な要点は「この顔文字はモデルが悲しいことを意味する」ではなく、「この顔文字は、モデル自身が悲しいと分類するような文脈に対応していることが多い」ということだ。

これらの結果についてさらに議論したい方は、Discord、Twitter、メールでお気軽に。顔文字データへの貢献は、pypi 上の `llmoji` パッケージが匿名でアップロードを処理してくれる。
