"use client"

import { ChevronLeft, ShoppingBag, Star, Plus, Minus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function CanteenPage() {
    const [cart, setCart] = useState<{ id: number, qty: number }[]>([])

    const menu = [
        { id: 1, name: "Veg Burger", price: 45, rating: 4.5, image: "🍔", category: "Snacks" },
        { id: 2, name: "Masala Dosa", price: 60, rating: 4.8, image: "🥞", category: "Breakfast" },
        { id: 3, name: "Cold Coffee", price: 35, rating: 4.2, image: "🥤", category: "Beverages" },
        { id: 4, name: "Chicken Biryani", price: 120, rating: 4.9, image: "🍗", category: "Lunch" },
    ]

    const addToCart = (id: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === id)
            if (existing) {
                return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item)
            }
            return [...prev, { id, qty: 1 }]
        })
    }

    const removeFromCart = (id: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === id)
            if (existing && existing.qty > 1) {
                return prev.map(item => item.id === id ? { ...item, qty: item.qty - 1 } : item)
            }
            return prev.filter(item => item.id !== id)
        })
    }

    const getQty = (id: number) => cart.find(item => item.id === id)?.qty || 0

    const totalAmount = cart.reduce((acc, item) => {
        const product = menu.find(p => p.id === item.id)
        return acc + (product ? product.price * item.qty : 0)
    }, 0)

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">College Canteen</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Banner */}
                <div className="bg-orange-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute right-0 top-0 text-9xl opacity-20 -mr-4 -mt-4">🍕</div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-1">Hungry?</h2>
                        <p className="text-orange-100 text-sm mb-4">Order now and skip the queue!</p>
                        <button className="bg-white text-orange-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm">View Today's Special</button>
                    </div>
                </div>

                {/* Menu */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">Menu</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {menu.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                <div className="text-4xl mb-2">{item.image}</div>
                                <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" /> {item.rating}
                                </div>
                                <div className="flex justify-between items-center w-full mt-auto pt-2">
                                    <span className="font-bold text-gray-900">₹{item.price}</span>
                                    {getQty(item.id) > 0 ? (
                                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                            <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center text-xs font-bold">-</button>
                                            <span className="text-xs font-bold w-3">{getQty(item.id)}</span>
                                            <button onClick={() => addToCart(item.id)} className="w-6 h-6 bg-indigo-600 text-white rounded shadow-sm flex items-center justify-center text-xs font-bold">+</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart(item.id)} className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart Float */}
            {cart.length > 0 && (
                <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
                    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400">{cart.reduce((a, b) => a + b.qty, 0)} Items</p>
                            <p className="font-bold text-lg">₹ {totalAmount}</p>
                        </div>
                        <button className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-900/20 flex items-center gap-2">
                            Checkout <ShoppingBag className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
