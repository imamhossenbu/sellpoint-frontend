// components/Hero.jsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";

export default function Hero({ onSearch }) {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [price, setPrice] = useState([0, 1000]); // min, max

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSearch) {
            onSearch({ query, category, price });
        }
    };

    return (
        <section
            className="relative h-[80vh] flex items-center justify-center text-center"
        >
            {/* Background image */}
            <div className="absolute inset-0">
                <img
                    src="hero-bg.jpg"
                    alt="Hero Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-4xl mx-auto px-4"
            >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Find Your Perfect Listing
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8">
                    Search thousands of properties, cars, and more
                </p>

                {/* Search + Filters */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-lg p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    {/* Search input */}
                    <div className="flex items-center border rounded-xl px-3">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search listings..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 px-2 py-2 outline-none"
                        />
                    </div>

                    {/* Category filter */}
                    <div>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl outline-none"
                        >
                            <option value="all">All Categories</option>
                            <option value="property">Property</option>
                            <option value="car">Cars</option>
                            <option value="electronics">Electronics</option>
                        </select>
                    </div>

                    {/* Price range */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Price Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={price[0]}
                                onChange={(e) =>
                                    setPrice([Number(e.target.value), price[1]])
                                }
                                className="w-20 px-2 py-1 border rounded-md text-sm"
                            />
                            <span>-</span>
                            <input
                                type="number"
                                value={price[1]}
                                onChange={(e) =>
                                    setPrice([price[0], Number(e.target.value)])
                                }
                                className="w-20 px-2 py-1 border rounded-md text-sm"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="flex items-center justify-center gap-2 rounded-xl btn-brand px-4 py-2 text-white"
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        Search
                    </button>
                </form>
            </motion.div>
        </section>
    );
}
