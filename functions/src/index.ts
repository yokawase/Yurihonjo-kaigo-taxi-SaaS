import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * 予約リクエスト作成API (Callable Function)
 * 
 * 目的: 条件に合致する空き車両を検索し、重複予約を防ぎながら予約リクエストを作成する。
 */
export const requestBooking = functions.https.onCall(async (data, context) => {
  // 1. 認証チェック (未ログインユーザーを弾く)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      '予約を行うにはログインが必要です。'
    );
  }

  const {
    patientId,
    pickupDatetime, // ISO 8601形式の文字列 (例: "2026-02-26T10:00:00Z")
    pickupLocation,
    dropoffLocation,
    requiresWheelchair,
    useInsurance,
  } = data;

  const requestedTimeMs = new Date(pickupDatetime).getTime();
  // 予約の前後1時間を「稼働中（ブロック）」とみなすバッファ時間
  const BUFFER_TIME_MS = 60 * 60 * 1000; 

  try {
    // 2. トランザクション処理の開始 (重複予約の防止)
    const result = await db.runTransaction(async (transaction) => {
      
      // --- A. 条件に合う車両を検索 ---
      const vehiclesRef = db.collection('vehicles');
      let vehicleQuery = vehiclesRef.where('status', '==', 'available');
      
      if (requiresWheelchair) {
        vehicleQuery = vehicleQuery.where('isWheelchairAccessible', '==', true);
      }
      if (useInsurance) {
        vehicleQuery = vehicleQuery.where('acceptsInsurance', '==', true);
      }

      // トランザクション内で車両リストを取得
      const vehiclesSnapshot = await transaction.get(vehicleQuery);
      if (vehiclesSnapshot.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          '条件に合致する車両が見つかりません。'
        );
      }

      let availableVehicle = null;

      // --- B. 空き時間の確認 (重複チェック) ---
      for (const doc of vehiclesSnapshot.docs) {
        const vehicleData = doc.data();
        
        // この車両の「リクエスト中」または「確定済み」の予約を取得
        const bookingsRef = db.collection('bookings');
        const conflictingBookingsSnapshot = await transaction.get(
          bookingsRef
            .where('vehicleId', '==', doc.id)
            .where('status', 'in', ['pending', 'confirmed'])
        );

        let isConflict = false;
        for (const bookingDoc of conflictingBookingsSnapshot.docs) {
          const existingBookingTimeMs = new Date(bookingDoc.data().pickupDatetime).getTime();
          
          // 希望時間が既存の予約の前後1時間以内にかぶっているかチェック
          if (Math.abs(existingBookingTimeMs - requestedTimeMs) < BUFFER_TIME_MS) {
            isConflict = true;
            break; // かぶっていればこの車両はスキップ
          }
        }

        // 競合がなければ、この車両を割り当て対象とする
        if (!isConflict) {
          availableVehicle = { id: doc.id, ...vehicleData };
          break; 
        }
      }

      // 全ての車両が埋まっていた場合
      if (!availableVehicle) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          '指定された日時は、条件に合う全ての車両が予約済みです。別の日時をご検討ください。'
        );
      }

      // --- C. 予約データの書き込み ---
      const newBookingRef = db.collection('bookings').doc();
      const bookingData = {
        bookingId: newBookingRef.id,
        patientId,
        requestedBy: context.auth.uid, // 予約操作を行ったユーザー(家族 or ケアマネ)
        operatorId: availableVehicle.operatorId,
        vehicleId: availableVehicle.id,
        pickupDatetime,
        pickupLocation,
        dropoffLocation,
        status: 'pending', // 事業者の承認待ちステータス
        requiresWheelchair,
        useInsurance,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // トランザクション内で書き込みを実行 (ここで他と競合した場合は自動リトライされる)
      transaction.set(newBookingRef, bookingData);

      return { 
        success: true, 
        bookingId: newBookingRef.id, 
        vehicle: availableVehicle 
      };
    });

    return result;

  } catch (error) {
    console.error('Booking transaction failed:', error);
    // 既にHttpsErrorとして投げられたものはそのままスロー
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    // 予期せぬエラー
    throw new functions.https.HttpsError(
      'internal',
      '予約処理中にシステムエラーが発生しました。',
      error
    );
  }
});
