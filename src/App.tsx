import React, { useState } from 'react';
import { Calendar, Car, Clock, MapPin, Phone, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Role, Patient, Operator, Vehicle, Booking } from './types';
import FamilyBookingSearch from './components/FamilyBookingSearch';

// --- Mock Data ---
const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: '佐藤 トメ (82歳)', requiresWheelchair: true, hasNursingInsurance: true },
  { id: 'p2', name: '鈴木 一郎 (78歳)', requiresWheelchair: false, hasNursingInsurance: true },
];

const MOCK_OPERATORS: Operator[] = [
  { id: 'o1', name: '由利本荘ケアタクシー' },
  { id: 'o2', name: 'まごころ福祉タクシー' },
  { id: 'o3', name: '鳥海おでかけサポート' },
];

const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', operatorId: 'o1', name: '車両A (ハイエース)', isWheelchairAccessible: true, acceptsInsurance: true },
  { id: 'v2', operatorId: 'o1', name: '車両B (ノア)', isWheelchairAccessible: false, acceptsInsurance: true },
  { id: 'v3', operatorId: 'o2', name: '車両C (キャラバン)', isWheelchairAccessible: true, acceptsInsurance: false },
  { id: 'v4', operatorId: 'o3', name: '車両D (シエンタ)', isWheelchairAccessible: true, acceptsInsurance: true },
];

export default function App() {
  const [role, setRole] = useState<Role>('family');
  const [bookings, setBookings] = useState<Booking[]>([]);

  const handleFamilyBook = (vehicle: Vehicle, date: string, time: string, requiresWheelchair: boolean, useInsurance: boolean) => {
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      patientId: MOCK_PATIENTS[0].id, // 家族画面では固定の要介護者を想定
      operatorId: vehicle.operatorId,
      vehicleId: vehicle.id,
      pickupDatetime: `${date} ${time}`,
      pickupLocation: '由利本荘市吉沢',
      dropoffLocation: '由利組合総合病院',
      status: 'pending',
      requiresWheelchair,
      useInsurance,
    };
    setBookings([...bookings, newBooking]);
    alert('予約リクエストを送信しました。事業者の承認をお待ちください。');
    setRole('operator'); // デモ用に事業者画面へ遷移
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">由利本荘 ケアモビリティ</h1>
          </div>
          <div className="flex gap-2">
            {(['family', 'care_manager', 'operator'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  role === r ? 'bg-white text-emerald-800 font-semibold' : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-600'
                }`}
              >
                {r === 'family' ? '家族' : r === 'care_manager' ? 'ケアマネ' : '事業者'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {role === 'family' && (
          <FamilyBookingSearch 
            operators={MOCK_OPERATORS} 
            vehicles={MOCK_VEHICLES} 
            onBook={handleFamilyBook} 
          />
        )}
        {role === 'care_manager' && (
          <SearchAndBookView role={role} bookings={bookings} setBookings={setBookings} />
        )}
        {role === 'operator' && (
          <OperatorDashboard bookings={bookings} setBookings={setBookings} />
        )}
      </main>
    </div>
  );
}

// --- Views ---

function SearchAndBookView({ role, bookings, setBookings }: { role: Role, bookings: Booking[], setBookings: React.Dispatch<React.SetStateAction<Booking[]>> }) {
  const [selectedPatient, setSelectedPatient] = useState<string>(MOCK_PATIENTS[0].id);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [pickup, setPickup] = useState<string>('由利本荘市吉沢');
  const [dropoff, setDropoff] = useState<string>('由利組合総合病院');
  const [searchResults, setSearchResults] = useState<Vehicle[] | null>(null);

  const patient = MOCK_PATIENTS.find(p => p.id === selectedPatient)!;

  const handleSearch = () => {
    // Simulate searching Firestore for available vehicles matching criteria
    const results = MOCK_VEHICLES.filter(v => {
      if (patient.requiresWheelchair && !v.isWheelchairAccessible) return false;
      if (patient.hasNursingInsurance && !v.acceptsInsurance) return false;
      return true;
    });
    setSearchResults(results);
  };

  const handleBook = (vehicle: Vehicle) => {
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      patientId: patient.id,
      operatorId: vehicle.operatorId,
      vehicleId: vehicle.id,
      pickupDatetime: `${date} ${time}`,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      status: 'pending',
      requiresWheelchair: patient.requiresWheelchair,
      useInsurance: patient.hasNursingInsurance,
    };
    setBookings([...bookings, newBooking]);
    setSearchResults(null);
    alert('予約リクエストを送信しました。事業者の承認をお待ちください。');
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            タクシー空車検索・予約
          </h2>
          
          <div className="space-y-4">
            {role === 'care_manager' && (
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">対象の利用者</label>
                <select 
                  className="w-full p-3 border border-stone-300 rounded-xl bg-stone-50"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  {MOCK_PATIENTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">利用日</label>
                <input type="date" className="w-full p-3 border border-stone-300 rounded-xl bg-stone-50" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">希望時間</label>
                <input type="time" className="w-full p-3 border border-stone-300 rounded-xl bg-stone-50" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">迎車場所</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input type="text" className="w-full pl-9 p-3 border border-stone-300 rounded-xl bg-stone-50" value={pickup} onChange={e => setPickup(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">目的地</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                  <input type="text" className="w-full pl-9 p-3 border border-stone-300 rounded-xl bg-stone-50" value={dropoff} onChange={e => setDropoff(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-stone-100 p-4 rounded-xl flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={patient.requiresWheelchair} readOnly className="w-4 h-4 text-emerald-600 rounded" />
                車椅子対応必須
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={patient.hasNursingInsurance} readOnly className="w-4 h-4 text-emerald-600 rounded" />
                介護保険適用
              </label>
            </div>

            <button 
              onClick={handleSearch}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              空車を検索する
            </button>
          </div>
        </div>

        {searchResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">検索結果 ({searchResults.length}件)</h3>
            {searchResults.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center text-stone-500">
                条件に合致する空車が見つかりませんでした。時間を変更してお試しください。
              </div>
            ) : (
              searchResults.map(vehicle => {
                const operator = MOCK_OPERATORS.find(o => o.id === vehicle.operatorId);
                return (
                  <div key={vehicle.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">{operator?.name}</h4>
                      <p className="text-sm text-stone-500">{vehicle.name}</p>
                      <div className="flex gap-2 mt-2">
                        {vehicle.isWheelchairAccessible && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md">車椅子可</span>}
                        {vehicle.acceptsInsurance && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">保険適用可</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleBook(vehicle)}
                      className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      予約リクエスト
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sidebar: Current Bookings */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">現在の予約状況</h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-stone-500">予約はありません</p>
        ) : (
          bookings.map(booking => {
            const operator = MOCK_OPERATORS.find(o => o.id === booking.operatorId);
            const patient = MOCK_PATIENTS.find(p => p.id === booking.patientId);
            return (
              <div key={booking.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status === 'pending' ? 'リクエスト中' : booking.status === 'confirmed' ? '予約確定' : 'キャンセル'}
                  </span>
                  <span className="text-stone-500">{booking.pickupDatetime}</span>
                </div>
                <p className="font-bold">{operator?.name}</p>
                <p className="text-stone-600 mt-1">{patient?.name}</p>
                <div className="mt-2 pt-2 border-t border-stone-100 text-stone-500 flex flex-col gap-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {booking.pickupLocation}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {booking.dropoffLocation}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function OperatorDashboard({ bookings, setBookings }: { bookings: Booking[], setBookings: React.Dispatch<React.SetStateAction<Booking[]>> }) {
  // Simulate being logged in as Operator 1
  const myOperatorId = 'o1';
  const myBookings = bookings.filter(b => b.operatorId === myOperatorId);

  const handleStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">事業者ダッシュボード</h2>
          <p className="text-stone-500">由利本荘ケアタクシー 様</p>
        </div>
        <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          受付中
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            新規リクエスト
          </h3>
          <div className="space-y-4">
            {myBookings.filter(b => b.status === 'pending').length === 0 ? (
              <p className="text-sm text-stone-500">新規リクエストはありません</p>
            ) : (
              myBookings.filter(b => b.status === 'pending').map(booking => {
                const patient = MOCK_PATIENTS.find(p => p.id === booking.patientId);
                const vehicle = MOCK_VEHICLES.find(v => v.id === booking.vehicleId);
                return (
                  <div key={booking.id} className="border border-stone-200 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-lg">{booking.pickupDatetime}</span>
                    </div>
                    <p className="font-medium">{patient?.name}</p>
                    <div className="text-sm text-stone-600 mt-2 space-y-1">
                      <p>迎車: {booking.pickupLocation}</p>
                      <p>目的: {booking.dropoffLocation}</p>
                      <p>希望車両: {vehicle?.name}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        承認する
                      </button>
                      <button 
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-800 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        お断り
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            確定済みスケジュール
          </h3>
          <div className="space-y-4">
            {myBookings.filter(b => b.status === 'confirmed').length === 0 ? (
              <p className="text-sm text-stone-500">確定済みの予約はありません</p>
            ) : (
              myBookings.filter(b => b.status === 'confirmed').map(booking => {
                const patient = MOCK_PATIENTS.find(p => p.id === booking.patientId);
                return (
                  <div key={booking.id} className="border-l-4 border-emerald-500 bg-stone-50 p-4 rounded-r-xl">
                    <p className="font-bold">{booking.pickupDatetime}</p>
                    <p className="text-sm font-medium mt-1">{patient?.name}</p>
                    <p className="text-xs text-stone-500 mt-1">{booking.pickupLocation} → {booking.dropoffLocation}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
