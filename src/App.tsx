import React, { useState, useCallback, useMemo } from 'react';
import type { UserProfile, Meal, RecommendedMeal, WeeklyPlan, MealTime } from './types';
import { getMealRecommendation } from './services/geminiService';
import Card, { CardContent, CardHeader } from './components/Card';
import { FridgeIcon, MenuBookIcon, PlusIcon, ShoppingCartIcon, SparklesIcon, TrashIcon, LightBulbIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardListIcon, CheckCircleIcon } from './components/icons';


const getMonday = (d: Date): Date => {
  d = new Date(d);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};


const App: React.FC = () => {
    const [profile] = useState<UserProfile>({
        preferences: ['매운 음식', '이탈리안 요리'],
        allergies: ['땅콩'],
        dietaryGoal: '고단백, 저탄수화물'
    });
    const [fridgeItems, setFridgeItems] = useState<string[]>(['닭가슴살', '브로콜리', '양파', '마늘', '올리브 오일', '토마토']);
    const [newItem, setNewItem] = useState('');
    
    const [myMenus, setMyMenus] = useState<Meal[]>([
        { menu_id: 'M1001', menu_name: '연어 스테이크', required_ingredients: ['연어', '토마토', '올리브오일', '버터'] },
        { menu_id: 'M1002', menu_name: '퀘사디아', required_ingredients: ['또띠아', '간소고기', '양파', '양배추', '파프리카', '치즈'] },
        { menu_id: 'M1003', menu_name: '미역국', required_ingredients: ['소고기', '미역', '국간장'] },
        { menu_id: 'M1004', menu_name: '프렌치 토스트', required_ingredients: ['식빵', '우유', '계란'] },
        { menu_id: 'M1005', menu_name: '오트밀 죽', required_ingredients: ['시금치', '토마토', '코인육수', '계란'] },
        { menu_id: 'M1006', menu_name: '볶음밥', required_ingredients: ['밥', '각종 야채', '고기류'] },
        { menu_id: 'M1007', menu_name: '소고기 뭇국', required_ingredients: ['소고기', '무', '육수재료'] },
        { menu_id: 'M1008', menu_name: '황태국', required_ingredients: ['무', '황태', '육수재료'] },
        { menu_id: 'M1009', menu_name: '떡국', required_ingredients: ['양지육수', '떡국떡', '만두', '계란'] },
        { menu_id: 'M1010', menu_name: '감자오믈렛', required_ingredients: ['감자', '각종 야채', '계란'] },
        { menu_id: 'M1011', menu_name: '된장찌개', required_ingredients: ['된장', '양파', '애호박', '감자'] },
    ]);
    const [newMenuName, setNewMenuName] = useState('');
    const [newMenuIngredients, setNewMenuIngredients] = useState('');


    const [recommendations, setRecommendations] = useState<RecommendedMeal[]>([]);
    const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
        recommendation: false,
    });
    const [error, setError] = useState<string | null>(null);

    // Weekly Planner State
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysOfWeek = useMemo(() => ['월', '화', '수', '목', '금', '토', '일'], []);
    const mealTimes: MealTime[] = useMemo(() => ['아침', '점심', '저녁'], []);

    const weekDates = useMemo(() => {
        const start = getMonday(currentDate);
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    }, [currentDate]);

    const initialPlan: WeeklyPlan = useMemo(() => daysOfWeek.reduce((acc, day) => {
        acc[day] = { '아침': [], '점심': [], '저녁': [] };
        return acc;
    }, {} as WeeklyPlan), [daysOfWeek]);

    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(initialPlan);
    const [isMenuSelectorOpen, setIsMenuSelectorOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<{ day: string; time: MealTime } | null>(null);
    const [activeListTab, setActiveListTab] = useState<'shopping' | 'required'>('shopping');
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const handleGetRecommendation = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, recommendation: true }));
        setError(null);
        try {
            const result = await getMealRecommendation(profile, fridgeItems, myMenus);
            if (result && result.length > 0) {
              setRecommendations(prev => [...result, ...prev]);
            } else {
              setError("추천을 받지 못했습니다. AI가 바쁜 것 같아요. 다시 시도해 주세요.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
        } finally {
            setIsLoading(prev => ({ ...prev, recommendation: false }));
        }
    }, [profile, fridgeItems, myMenus]);

    const handleAddNewMenu = () => {
        if (!newMenuName.trim() || !newMenuIngredients.trim()) return;

        const ingredientsArray = newMenuIngredients
            .split(',')
            .map(ing => ing.trim())
            .filter(ing => ing);

        if (ingredientsArray.length === 0) return;

        const newMenu: Meal = {
            menu_id: `M${Date.now() % 10000}`,
            menu_name: newMenuName.trim(),
            required_ingredients: ingredientsArray,
        };

        setMyMenus(prev => [newMenu, ...prev]);
        setNewMenuName('');
        setNewMenuIngredients('');
    };

    const requiredIngredients = useMemo(() => {
        const allIngredients = new Set<string>();
        Object.values(weeklyPlan).forEach(dayPlan => {
            Object.values(dayPlan).forEach(meals => {
                meals.forEach(meal => {
                    meal.required_ingredients.forEach(ing => allIngredients.add(ing));
                });
            });
        });
        return Array.from(allIngredients).sort();
    }, [weeklyPlan]);

    const shoppingList = useMemo(() => {
        if (requiredIngredients.length === 0) return [];
        
        const neededIngredients = requiredIngredients.filter(
            ing => !fridgeItems.some(fItem => fItem.toLowerCase().includes(ing.toLowerCase()))
        );
        return neededIngredients;
    }, [requiredIngredients, fridgeItems]);
    
    const handleAddItemToFridge = () => {
        if (newItem.trim() && !fridgeItems.includes(newItem.trim())) {
            setFridgeItems(prev => [...prev, newItem.trim()].sort());
            setNewItem('');
        }
    };

    const handleRemoveFridgeItem = (itemToRemove: string) => {
        setFridgeItems(prev => prev.filter(item => item !== itemToRemove));
    };

    const handleToggleCheckItem = (item: string) => {
        setCheckedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(item)) {
                newSet.delete(item);
            } else {
                newSet.add(item);
            }
            return newSet;
        });
    };
    
    const handleAddCheckedToFridge = () => {
        const newFridgeItems = new Set([...fridgeItems, ...checkedItems]);
        setFridgeItems(Array.from(newFridgeItems).sort());
        setCheckedItems(new Set());
    };

    // Planner handlers
    const handlePreviousWeek = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(prevDate.getDate() - 7);
            return newDate;
        });
    };

    const handleNextWeek = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(prevDate.getDate() + 7);
            return newDate;
        });
    };
    
    const formatDateRange = (dates: Date[]) => {
        if (!dates || dates.length < 7) return '';
        const start = dates[0];
        const end = dates[6];
        const startYear = start.getFullYear();
        const startMonth = (start.getMonth() + 1).toString().padStart(2, '0');
        const startDay = start.getDate().toString().padStart(2, '0');
        const endMonth = end.getMonth() + 1;
        const endDay = end.getDate();

        return `${startYear}.${startMonth}.${startDay} ~ ${endMonth}월 ${endDay}일`;
    };

    const handleOpenMenuSelector = (day: string, time: MealTime) => {
        setEditingSlot({ day, time });
        setIsMenuSelectorOpen(true);
    };

    const handleSelectMenuForPlan = (menu: Meal) => {
        if (editingSlot) {
            setWeeklyPlan(prev => {
                const currentMeals = prev[editingSlot.day][editingSlot.time] || [];
                // Prevent adding duplicate menus to the same slot
                if (currentMeals.some(m => m.menu_id === menu.menu_id)) {
                    return prev;
                }
                return {
                    ...prev,
                    [editingSlot.day]: {
                        ...prev[editingSlot.day],
                        [editingSlot.time]: [...currentMeals, menu],
                    }
                };
            });
        }
        setIsMenuSelectorOpen(false);
        setEditingSlot(null);
    };

    const handleClearMenuFromPlan = (day: string, time: MealTime, menuIdToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the selector
        setWeeklyPlan(prev => {
            const updatedMeals = prev[day][time].filter(m => m.menu_id !== menuIdToRemove);
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    [time]: updatedMeals
                }
            };
        });
    };
    
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI 개인 맞춤형 식단 플래너</h1>
                    <p className="text-slate-600 mt-1">맛있고 건강한 식사를 위한 스마트 비서</p>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {error && <div className="lg:col-span-2 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div>}
                
                <Card className="lg:col-span-2">
                    <CardHeader icon={<MenuBookIcon className="w-6 h-6 text-cyan-500"/>}>주간 식단 계획</CardHeader>
                    <CardContent className="overflow-x-auto">
                       <div className="flex items-center justify-center space-x-4 mb-4">
                            <button onClick={handlePreviousWeek} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                                <ChevronLeftIcon className="w-5 h-5 text-slate-600"/>
                            </button>
                            <h3 className="font-bold text-lg text-slate-700 tracking-wide text-center w-64">
                                ({formatDateRange(weekDates)})
                            </h3>
                            <button onClick={handleNextWeek} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                                <ChevronRightIcon className="w-5 h-5 text-slate-600"/>
                            </button>
                        </div>

                        <table className="w-full border-collapse text-center table-fixed">
                            <colgroup>
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '28.33%' }} />
                                <col style={{ width: '28.33%' }} />
                                <col style={{ width: '28.33%' }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="p-2 border border-slate-200 font-semibold"></th>
                                    {mealTimes.map(time => <th key={time} className="p-2 border border-slate-200 font-semibold text-slate-600">{time}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {weekDates.map((date, index) => {
                                    const day = daysOfWeek[index];
                                    const dayPlan = weeklyPlan[day];
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    return (
                                        <tr key={day}>
                                            <td className={`p-2 border border-slate-200 ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className={`text-xl font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{date.getDate()}</span>
                                                    <span className={`text-sm font-medium ${day === '토' ? 'text-blue-600' : day === '일' ? 'text-red-600' : 'text-slate-500'}`}>
                                                        {day}
                                                    </span>
                                                </div>
                                            </td>
                                            {mealTimes.map(time => {
                                                const meals = dayPlan?.[time] ?? [];
                                                return (
                                                    <td key={`${day}-${time}`} className="p-1 border border-slate-200 align-top">
                                                        <div
                                                            onClick={() => handleOpenMenuSelector(day, time)}
                                                            className={`min-h-[6rem] h-full flex flex-col items-center p-2 rounded-md transition-colors cursor-pointer group ${
                                                                meals.length > 0 ? 'bg-cyan-50 justify-start' : 'hover:bg-slate-100 text-slate-400 justify-center'
                                                            }`}
                                                        >
                                                            {meals.length > 0 ? (
                                                                <div className="w-full space-y-1">
                                                                    {meals.map((meal) => (
                                                                        <div key={meal.menu_id} className="relative group/item bg-white p-1 rounded-md shadow-sm w-full text-left">
                                                                            <span className="font-semibold text-xs text-cyan-900 break-words pr-4">{meal.menu_name}</span>
                                                                            <button
                                                                                onClick={(e) => handleClearMenuFromPlan(day, time, meal.menu_id, e)}
                                                                                className="absolute top-1/2 -translate-y-1/2 right-1 bg-red-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover/item:opacity-100 transition-opacity z-10 hover:bg-red-500"
                                                                            >
                                                                                &times;
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <PlusIcon className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader icon={<MenuBookIcon className="w-6 h-6 text-blue-500"/>}>내 메뉴</CardHeader>
                    <CardContent>
                        <div className="space-y-3 mb-4">
                            <input
                                type="text"
                                value={newMenuName}
                                onChange={(e) => setNewMenuName(e.target.value)}
                                placeholder="새 메뉴 이름"
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                                type="text"
                                value={newMenuIngredients}
                                onChange={(e) => setNewMenuIngredients(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddNewMenu()}
                                placeholder="필요 재료 (쉼표로 구분)"
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                         <button 
                            onClick={handleAddNewMenu} 
                            disabled={!newMenuName.trim() || !newMenuIngredients.trim()}
                            className="w-full mb-4 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center disabled:bg-blue-300"
                        >
                            <PlusIcon className="w-5 h-5 mr-2"/>
                            <span>메뉴 추가</span>
                        </button>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {myMenus.map(menu => (
                                <div key={menu.menu_id} className={`p-3 rounded-lg transition-all ${selectedMenuId === menu.menu_id ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-100'}`} onClick={() => setSelectedMenuId(menu.menu_id)}>
                                    <h4 className="font-bold">{menu.menu_name}</h4>
                                    <p className="text-sm text-slate-600">{menu.required_ingredients.join(', ')}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <div className="border-b border-slate-200">
                        <div className="flex -mb-px">
                            <button
                                onClick={() => setActiveListTab('shopping')}
                                className={`flex items-center justify-center gap-2 p-4 border-b-2 font-semibold text-sm w-1/2 ${
                                    activeListTab === 'shopping' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <ShoppingCartIcon className="w-5 h-5"/>
                                쇼핑 리스트
                            </button>
                            <button
                                onClick={() => setActiveListTab('required')}
                                className={`flex items-center justify-center gap-2 p-4 border-b-2 font-semibold text-sm w-1/2 ${
                                    activeListTab === 'required' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <ClipboardListIcon className="w-5 h-5"/>
                                필요 식재료
                            </button>
                        </div>
                    </div>
                    <CardContent>
                       {activeListTab === 'shopping' ? (
                            shoppingList.length > 0 ? (
                                <>
                                    <ul className="space-y-1 max-h-60 overflow-y-auto pr-2">
                                        {shoppingList.map(item => (
                                            <li key={item}>
                                                <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={checkedItems.has(item)}
                                                        onChange={() => handleToggleCheckItem(item)}
                                                        className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                                    />
                                                    <span className={`transition-all ${checkedItems.has(item) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                        {item}
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                    {checkedItems.size > 0 && (
                                        <button
                                            onClick={handleAddCheckedToFridge}
                                            className="w-full mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-all flex items-center justify-center space-x-2"
                                        >
                                            <CheckCircleIcon className="w-5 h-5"/>
                                            <span>체크한 항목 냉장고에 추가</span>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-500 text-center py-4">
                                    {requiredIngredients.length > 0 ? '필요한 모든 재료가 냉장고에 있습니다!' : '구매할 식재료가 없습니다!'}
                                </p>
                            )
                       ) : (
                            requiredIngredients.length > 0 ? (
                               <ul className="space-y-2 max-h-60 overflow-y-auto">
                                 {requiredIngredients.map(item => <li key={item} className="bg-teal-50 text-teal-800 p-2 rounded-md">{item}</li>)}
                               </ul>
                           ) : (
                               <p className="text-slate-500 text-center py-4">주간 계획에 메뉴를 추가하면 모든 필요 재료가 여기에 표시됩니다.</p>
                           )
                       )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader icon={<FridgeIcon className="w-6 h-6 text-green-500"/>}>나의 냉장고</CardHeader>
                    <CardContent>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddItemToFridge()}
                                placeholder="식재료 추가..."
                                className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button onClick={handleAddItemToFridge} className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center">
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                            {fridgeItems.map(item => (
                                <li key={item} className="flex justify-between items-center bg-slate-100 p-2 rounded-md">
                                    <span>{item}</span>
                                    <button onClick={() => handleRemoveFridgeItem(item)} className="text-slate-400 hover:text-red-500">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader icon={<SparklesIcon className="w-6 h-6 text-purple-500"/>}>AI 식단 추천</CardHeader>
                    <CardContent>
                        <button
                            onClick={handleGetRecommendation}
                            disabled={isLoading.recommendation}
                            className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 transition-all flex items-center justify-center space-x-2 disabled:bg-purple-300"
                        >
                            {isLoading.recommendation ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>맛있는 메뉴를 생각 중이에요...</span>
                              </>
                            ) : (
                              <>
                                <SparklesIcon className="w-5 h-5"/>
                                <span>새로운 식단 추천받기</span>
                              </>
                            )}
                        </button>
                         {recommendations.length > 0 && (
                            <div className="mt-6 space-y-4">
                              {recommendations.map((rec) => (
                                <div key={rec.menu_id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                  <h3 className="text-xl font-bold text-slate-800">{rec.menu_name}</h3>
                                  <p className="text-slate-600 mt-2 flex items-start gap-2">
                                    <LightBulbIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                                    <span>{rec.reasoning}</span>
                                  </p>
                                  <div className="mt-3">
                                    <h4 className="font-semibold text-slate-700">필요한 식재료:</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {rec.required_ingredients.map(ing => {
                                            const inFridge = fridgeItems.some(f => f.toLowerCase().includes(ing.toLowerCase()));
                                            const colorClass = inFridge 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800';
                                            return (
                                                <span key={ing} className={`px-2 py-1 rounded-full text-sm ${colorClass}`}>{ing}</span>
                                            );
                                        })}
                                    </div>
                                  </div>
                                  <div className="mt-4 flex gap-2">
                                    <button onClick={() => {
                                        if (!myMenus.some(m => m.menu_id === rec.menu_id)) {
                                            setMyMenus(prev => [rec, ...prev]);
                                        }
                                    }} className="text-sm bg-indigo-500 text-white py-1 px-3 rounded-md hover:bg-indigo-600">내 메뉴에 추가</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
             {isMenuSelectorOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsMenuSelectorOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-bold">메뉴 선택</h3>
                            <p className="text-sm text-slate-500">{editingSlot?.day} {editingSlot?.time} 식사</p>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {myMenus.length > 0 ? (
                                <ul className="space-y-2">
                                    {myMenus.map(menu => (
                                        <li key={menu.menu_id} onClick={() => handleSelectMenuForPlan(menu)} className="p-3 rounded-md hover:bg-slate-100 cursor-pointer transition-colors">
                                            <h4 className="font-semibold">{menu.menu_name}</h4>
                                            <p className="text-xs text-slate-500">{menu.required_ingredients.join(', ')}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-center py-4">'내 메뉴'에 먼저 메뉴를 추가해주세요.</p>
                            )}
                        </div>
                        <div className="p-4 border-t text-right">
                           <button onClick={() => setIsMenuSelectorOpen(false)} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
