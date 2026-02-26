# 統一ケアモビリティプラットフォーム MVP 設計書

## 1. アプリの主要機能リスト

### 利用者 / 家族向け機能
- **ユーザー登録・ログイン**: 電話番号またはメールアドレスでの認証 (Firebase Auth)
- **要介護者プロフィール管理**: 氏名、住所、車椅子利用の有無、介護保険適用の有無などの基本情報登録
- **タクシー空車検索**: 希望日時、乗降場所、車椅子対応、保険適用可否などの条件に基づくリアルタイム空車検索
- **予約リクエスト・キャンセル**: 条件に合致するタクシーへの予約リクエスト送信、および予約のキャンセル
- **予約状況確認**: 現在の予約状況（リクエスト中、確定、配車済みなど）と過去の利用履歴の確認
- **プッシュ通知**: 予約確定や到着時の通知受け取り

### ケアマネージャー向け機能
- **担当利用者（要介護者）管理**: 複数の担当利用者のプロフィールや介護保険情報を一元管理
- **代理検索・予約**: 担当利用者の条件（車椅子、保険適用など）に合わせたタクシーの代理検索と予約リクエスト
- **予約スケジュール管理**: 担当する全利用者のタクシー予約状況をカレンダー形式で一覧表示・管理
- **事業者とのメッセージ機能**: 予約に関する特記事項や状態の共有をタクシー事業者と直接やり取りする機能

### タクシー事業者向け機能
- **事業者・車両情報管理**: 営業時間、保有車両の登録（車椅子対応可否、ストレッチャー対応可否、介護保険適用可否など）
- **予約管理ダッシュボード**: 新規予約リクエストの受付、承認、拒否、キャンセルの管理
- **スケジュール・配車管理**: 車両ごとの稼働スケジュール管理、ドライバーへの配車割り当て
- **空車状況のリアルタイム更新**: 急な予定変更や空き時間の発生時に、システム上の空車状況を即座に更新

---

## 2. Firebase Firestore データモデル（スキーマ設計）

### `users` コレクション (ユーザー情報)
- `uid` (String): Firebase Auth UID
- `role` (String): `family` | `care_manager` | `operator`
- `name` (String): 氏名
- `phoneNumber` (String): 電話番号
- `createdAt` (Timestamp): 登録日時

### `patients` コレクション (要介護者情報)
- `patientId` (String): ドキュメントID
- `familyUid` (String): 家族のUID (参照用)
- `careManagerUid` (String): 担当ケアマネージャーのUID (参照用、任意)
- `name` (String): 要介護者氏名
- `address` (String): 住所
- `requiresWheelchair` (Boolean): 車椅子対応が必要か
- `hasNursingInsurance` (Boolean): 介護保険適用対象か
- `careLevel` (String): 要介護度 (例: "要介護2")

### `operators` コレクション (タクシー事業者情報)
- `operatorId` (String): ドキュメントID (通常は代表者のuidと一致)
- `companyName` (String): 事業者名
- `phoneNumber` (String): 連絡先電話番号
- `address` (String): 営業所住所
- `operatingHours` (Map): 営業時間 `{ start: "08:00", end: "18:00" }`

### `vehicles` コレクション (車両情報)
- `vehicleId` (String): ドキュメントID
- `operatorId` (String): 所属事業者のID
- `name` (String): 車両名またはナンバー
- `isWheelchairAccessible` (Boolean): 車椅子対応可否
- `acceptsInsurance` (Boolean): 介護保険適用可否
- `status` (String): `available` | `maintenance`

### `bookings` コレクション (予約情報)
- `bookingId` (String): ドキュメントID
- `patientId` (String): 要介護者のID
- `requestedBy` (String): 予約リクエスト者のUID (家族またはケアマネ)
- `operatorId` (String): 予約先事業者のID
- `vehicleId` (String): 割り当てられた車両ID (未定の場合はnull)
- `pickupDatetime` (Timestamp): 迎車日時
- `pickupLocation` (String): 迎車場所
- `dropoffLocation` (String): 目的地
- `status` (String): `pending` (リクエスト中) | `confirmed` (確定) | `cancelled` (キャンセル) | `completed` (完了)
- `requiresWheelchair` (Boolean): 予約時の車椅子要否条件
- `useInsurance` (Boolean): 予約時の保険適用希望
- `createdAt` (Timestamp): 予約作成日時
