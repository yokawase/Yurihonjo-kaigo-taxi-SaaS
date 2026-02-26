import React, { useState } from 'react';
import { Calendar, Clock, Search, Car, Check, AlertCircle } from 'lucide-react';
import { Vehicle, Operator } from '../types';

interface Props {
  operators: Operator[];
  vehicles: Vehicle[];
  onBook: (vehicle: Vehicle, date: string, time: string, requiresWheelchair: boolean, useInsurance: boolean) => void;
}

export default function FamilyBookingSearch({ operators, vehicles, onBook }: Props) {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [requiresWheelchair, setRequiresWheelchair] = useState<boolean>(false);
  const [useInsurance, setUseInsurance] = useState<boolean>(false);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Vehicle[] | null>(null);

  const handleSearch = () => {
    if (!date || !time) {
      alert('日付と時間を入力してください。');
      return;
    }
    
    setIsSearching(true);
    setSearchResults(null);
    
    // モックの非同期処理（Firestoreからの取得をシミュレート）
    setTimeout(() => {
      const results = vehicles.filter(v => {
        if (requiresWheelchair && !v.isWheelchairAccessible) return false;
        if (useInsurance && !v.acceptsInsurance) return false;
        return true;
      });
      setSearchResults(results);
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* 検索フォーム */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border-2 border-stone-200">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mb-8 border-b-4 border-emerald-500 pb-4">
          介護タクシーを探す
        </h2>

        <div className="space-y-10">
          {/* Step 1: 日時 */}
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-bold text-stone-800 flex items-center gap-3">
              <span className="bg-stone-800 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">1</span>
              いつ利用しますか？
            </h3>
            <div className="grid md:grid-cols-2 gap-6 bg-stone-50 p-6 rounded-2xl border border-stone-200">
              <div>
                <label className="block text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-emerald-600" /> 日付
                </label>
                <input 
                  type="date" 
                  className="w-full p-4 text-xl border-2 border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-white"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-emerald-600" /> 時間
                </label>
                <input 
                  type="time" 
                  className="w-full p-4 text-xl border-2 border-stone-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-white"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Step 2: 条件 */}
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-bold text-stone-800 flex items-center gap-3">
              <span className="bg-stone-800 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">2</span>
              必要な条件を選んでください
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => setRequiresWheelchair(!requiresWheelchair)}
                className={`w-full p-5 rounded-2xl border-4 text-left flex items-center gap-4 transition-all ${
                  requiresWheelchair 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  requiresWheelchair ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 bg-white'
                }`}>
                  {requiresWheelchair && <Check className="w-6 h-6" />}
                </div>
                <span className="text-xl md:text-2xl font-bold">車椅子のまま乗車する</span>
              </button>

              <button
                onClick={() => setUseInsurance(!useInsurance)}
                className={`w-full p-5 rounded-2xl border-4 text-left flex items-center gap-4 transition-all ${
                  useInsurance 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  useInsurance ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 bg-white'
                }`}>
                  {useInsurance && <Check className="w-6 h-6" />}
                </div>
                <span className="text-xl md:text-2xl font-bold">介護保険を利用する</span>
              </button>
            </div>
          </div>

          {/* Step 3: 検索ボタン */}
          <div className="pt-6">
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-900 text-2xl font-bold py-6 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-70"
            >
              {isSearching ? (
                <span className="animate-pulse">空き車両を探しています...</span>
              ) : (
                <>
                  <Search className="w-8 h-8" />
                  この条件でタクシーを探す
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      {searchResults !== null && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border-2 border-emerald-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Car className="w-8 h-8 text-emerald-600" />
            見つかったタクシー ({searchResults.length}件)
          </h2>

          {searchResults.length === 0 ? (
            <div className="bg-stone-100 p-8 rounded-2xl text-center">
              <AlertCircle className="w-16 h-16 text-stone-400 mx-auto mb-4" />
              <p className="text-xl font-bold text-stone-700 mb-2">
                ご希望の時間帯に空いているタクシーが見つかりませんでした。
              </p>
              <p className="text-lg text-stone-600">
                時間を少しずらして、再度検索をお試しください。
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {searchResults.map(vehicle => {
                const operator = operators.find(o => o.id === vehicle.operatorId);
                return (
                  <div key={vehicle.id} className="border-4 border-stone-200 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between hover:border-emerald-300 transition-colors">
                    <div className="w-full">
                      <h3 className="text-2xl font-bold text-stone-800 mb-2">{operator?.name}</h3>
                      <p className="text-lg text-stone-600 mb-4">車両: {vehicle.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.isWheelchairAccessible && (
                          <span className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-lg text-lg font-bold">
                            車椅子OK
                          </span>
                        )}
                        {vehicle.acceptsInsurance && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-lg font-bold">
                            介護保険OK
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full md:w-auto shrink-0">
                      <button 
                        onClick={() => onBook(vehicle, date, time, requiresWheelchair, useInsurance)}
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-md transition-colors"
                      >
                        予約を申し込む
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
