# 角色美術替換指南（用 AI 繪圖工具生成人物）

遊戲裡的人物預設是程式畫的 Q 版向量圖。你可以用 AI 繪圖工具（Midjourney、ChatGPT 圖片生成、Gemini、Stable Diffusion、Leonardo 等）產生人物，再放進遊戲自動替換，不用改任何程式碼。

---

## 一、遊戲需要的圖長什麼樣

每個角色是一張 **640×720 的透明背景 PNG**，切成 **4 欄 × 3 列、共 12 格**，每格 160×240，人物腳底對齊每格底部往上約 8px 的位置。

| 列＼欄 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| 第 1 列 | 正面站立 | 正面走路（左腳前） | 正面走路（右腳前） | 正面開心（舉手／笑） |
| 第 2 列 | 背面站立 | 背面走路（左腳前） | 背面走路（右腳前） | 正面端托盤 |
| 第 3 列 | 正面坐著 | 背面坐著 | 坐著打瞌睡 | 背面端托盤 |

- 「正面」= 人物朝向畫面左下方（斜 45° 的 3/4 側面，臉看得到）。
- 「背面」= 朝向畫面右上方（看得到後腦勺）。
- 往另一個方向走時，遊戲會自動左右翻轉，所以**只需要畫一個方向**。
- 坐姿不用畫椅子，遊戲裡的椅子會自己出現在人物後面。

**最省事的作法**：不用自己排版。用 AI 各別生成 12 張圖（或至少 3 張：正面站、背面站、正面坐），去背後丟進專案裡的 **`tools/sheet.html`** 組合工具，它會自動裁邊、縮放、對齊腳底並輸出 640×720 的 PNG。缺的格子會用同列第一張補上。

---

## 二、給 AI 的指令（直接複製）

AI 繪圖工具對英文的理解通常比中文穩定，建議用英文版；中文版給 ChatGPT／Gemini 這類對話式工具也可以。

### 1. 先做「角色設定圖」（決定長相，之後每張都拿它當參考）

**英文**

```
Chibi anime character design sheet, cute super-deformed proportions (head about 1/2 of total body height, 2.5 heads tall),
[角色描述，例如：a young female illustrator with a short brown bob haircut and a red beret, dusty-pink knit sweater, dark grey skirt, brown boots],
big sparkling anime eyes, soft blush, gentle smile,
casual mobile game art style, clean dark-brown line art, soft cel shading with light painted gradients, warm pastel colors,
full body, front view, 3/4 back view, and side view of the same character, standing,
plain white background, no text, no watermark
```

**中文**

```
Q 版動漫角色設定圖，可愛的大頭比例（頭約佔全身一半，2.5 頭身），
[角色描述，例如：年輕女插畫家，咖啡色短鮑伯頭、紅色貝雷帽、灰粉色針織毛衣、深灰裙子、咖啡色短靴]，
閃亮的大眼睛、淡淡腮紅、溫柔微笑，
手機休閒經營遊戲的美術風格，乾淨的深咖啡色線條，柔和的賽璐璐上色加一點手繪漸層，溫暖的粉彩色調，
同一個角色的全身正面、3/4 背面、側面站姿，
純白背景，不要文字、不要浮水印
```

### 2. 再生成各個動作（每張都附上第 1 步的圖當參考圖）

把下面的 `[動作]` 換成表格裡的動作，一次生成一張：

```
Same character as the reference image, exactly the same face, hairstyle, outfit and colors.
Chibi anime style, 2.5 heads tall, full body, isometric game sprite,
facing toward the bottom-left of the screen (3/4 front view, 45 degrees),
[動作],
clean line art, soft cel shading, plain white background, single character, no shadow on ground, no text
```

動作替換用語：

| 格子 | `[動作]` 英文 |
|---|---|
| 正面站 | standing still, arms relaxed |
| 正面走 1／2 | walking, left foot forward ／ walking, right foot forward |
| 正面開心 | happy, eyes closed smiling, one hand raised |
| 背面站 | seen from behind, facing away toward the top-right, standing (把 facing 那句改成這句) |
| 背面走 1／2 | seen from behind, facing away toward the top-right, walking, left/right foot forward |
| 正面端托盤 | holding a small round tray with a coffee cup in both hands |
| 背面端托盤 | seen from behind, facing away toward the top-right, holding a tray |
| 正面坐 | sitting on an invisible chair, knees bent, hands on lap, no chair visible |
| 背面坐 | seen from behind, sitting on an invisible chair, no chair visible |
| 坐著睡 | sitting on an invisible chair, dozing off, head tilted, eyes closed, "zzz" not drawn |

### 3. 店員專用：加制服

店員（含店長）建議在描述裡加：

```
wearing a dark green café apron over a white shirt, small brown ribbon at the collar
```

### 4. 保持同一個人的祕訣

- **一定要用參考圖**：Midjourney 用 `--cref 圖片網址 --cw 100`；ChatGPT／Gemini 直接把設定圖貼進對話再下指令；Stable Diffusion 用 IP-Adapter 或角色 LoRA。
- Midjourney 加 `--ar 2:3 --niji 6`（動漫風）比較好看；要統一畫風可再加 `--sref 同一張風格圖`。
- 同一個角色的 12 張盡量在**同一個對話**裡連續生成。
- 生成後若衣服顏色跑掉，叫它「只把裙子改回深灰色，其他不要動」比整張重畫有效。
- 背景若不是透明的：用 remove.bg、Photoshop「移除背景」、Canva 去背，或 ChatGPT 直接要求「transparent background PNG」。組合工具也會自動忽略純白邊。

---

## 三、放進遊戲

1. 把組好的 PNG 放到 `assets/chars/`，例如 `assets/chars/reg_lulu.png`。
2. 打開 `assets/chars/manifest.json`，寫上「角色代號 → 檔名」：

```json
{
  "owner": "owner.png",
  "staff_cashier": "staff_cashier.png",
  "reg_lulu": "reg_lulu.png",
  "customer_1": "customer_1.png"
}
```

3. 推上 GitHub（或本機重新整理），遊戲就會改用你的圖。沒寫在 manifest 裡的角色維持原本向量圖，所以可以**一個一個慢慢換**。

### 角色代號一覽

| 代號 | 角色 | 原本外型參考 |
|---|---|---|
| `owner` | 店長（玩家） | 可自由設計 |
| `staff_cashier` | 收銀店員 | 綠色圍裙制服 |
| `staff_pickup` | 送餐店員 | 同上 |
| `staff_recycle` | 回收店員 | 同上 |
| `staff_cleaner` | 清潔店員 | 同上 |
| `reg_zhe` | 阿哲（熬夜工程師） | 黑短髮、眼鏡、深灰帽 T、藍褲 |
| `reg_lulu` | 小鹿（插畫家） | 棕色鮑伯頭、紅貝雷帽、粉色上衣、深色裙 |
| `reg_yong` | 阿勇（健身教練） | 黑短髮、橘色棒球帽、黑色運動服 |
| `reg_lin` | 林老師（退休教授） | 灰白短髮、眼鏡、米色毛衣、咖啡褲 |
| `reg_qian` | 芊芊（大學新鮮人） | 深棕馬尾、灰綠上衣、米色褲 |
| `reg_momo` | Momo（甜點部落客） | 金色長髮、粉紅上衣、白裙 |
| `reg_elise` | Elise（鋼琴老師） | 黑髮包頭、全黑洋裝 |
| `reg_fei` | 小飛（外送員） | 棕短髮、黃色鴨舌帽、綠色外套 |
| `reg_kiri` | 霧島（推理小說家） | 深灰長髮、眼鏡、全黑穿搭 |
| `reg_wei` | 薇薇（花店老闆娘） | 紅棕捲髮、白上衣、綠裙 |
| `nb_mori` | 小森（鄰居店主） | 包頭、灰綠上衣 |
| `nb_harbor` | 海老闆（鄰居店主） | 深藍帽、海軍藍上衣 |
| `nb_rose` | 玫姊（鄰居店主） | 紅棕長髮、白上衣、酒紅裙 |
| `nb_rail` | 阿鐵（鄰居店主） | 黑捲髮、貝雷帽、黑上衣 |
| `npc_yun` | 小芸（劇情：店員兼小幫手） | 棕馬尾、白襯衫、綠圍裙、緞帶 |
| `npc_mike` | 麥克（劇情：甜點師） | 金短髮、白襯衫、米色圍裙 |
| `npc_chen` | 陳太太（劇情：房東太太） | 灰髮包頭、眼鏡、酒紅上衣 |
| `npc_nana` | 外婆（劇情） | 白髮包頭、眼鏡、灰綠上衣 |
| `customer_1` ～ `customer_14` | 一般路人客人（14 種輪流出現） | 自由設計，越多樣越好 |

---

## 四、已知限制

- 換成 PNG 的角色，**換裝（衣櫃）系統不會套用在它身上**，因為衣服已經畫死在圖裡。店長和店員若想保留換裝，就不要替換 `owner`／`staff_*`，或是每套衣服各畫一張再手動改 manifest。
- 每張 PNG 建議控制在 300KB 以內（可用 TinyPNG 壓縮），14 位客人 + 店員全換掉大約多 5～8MB 下載量，手機首次載入會變慢。
- AI 生成的圖要注意各工具的授權條款；若要商業上架，選擇允許商用的工具與方案。
