import React, { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { PieChart, Pie, Cell, Tooltip, Sector } from "recharts";

const COLORS = ["#FDBA74", "#F97316", "#0F2341"];

function AnimatedActiveShape({ props, animatedOuterRadius }) {
  const { cx, cy, innerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={animatedOuterRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={24}
      />
    </g>
  );
}

export default function TopCategoriesCard({ selectedStore }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [animatedOuterRadius, setAnimatedOuterRadius] = useState(95);
  const prevActiveIndex = useRef(-1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [catRes, prodRes, orderItemsRes] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/order-items").then((r) => r.json()),
        ]);
        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
        setOrderItems(orderItemsRes.data || []);
      } catch {
        setCategories([]);
        setProducts([]);
        setOrderItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Animate the outer radius for the active segment
  useEffect(() => {
    let animationFrame;
    const animate = () => {
      setAnimatedOuterRadius((current) => {
        const target = activeIndex !== -1 ? 105 : 95;
        if (Math.abs(current - target) < 0.5) return target;
        return current + (target - current) * 0.08;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [activeIndex]);

  // Aggregate sales by category
  const filteredOrderItems = orderItems.filter(
    (item) =>
      !selectedStore || String(item.orders?.store_id) === String(selectedStore)
  );
  
  const salesByCategory = {};
  filteredOrderItems.forEach((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product || !product.category_id) return;
    const catId = product.category_id;
    if (!salesByCategory[catId]) {
      salesByCategory[catId] = {
        id: catId,
        name: product.category_name || "Unknown",
        sales: 0,
      };
    }
    salesByCategory[catId].sales += Number(item.quantity) || 0;
  });
  const topCategories = Object.values(salesByCategory)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  // Prepare chart data
  const chartData = topCategories.map((cat) => ({
    name: cat.name,
    value: cat.sales,
  }));

  // Category statistics
  const totalCategories = categories.length;
  const totalProducts = products.length;

  // Custom activeShape renderer with animation
  const renderActiveShape = (props) => (
    <AnimatedActiveShape
      props={props}
      animatedOuterRadius={animatedOuterRadius}
    />
  );

  return (
    <div className="">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <span className="bg-orange-50 p-2 rounded-full">
            <Icon
              icon="mdi:account-group"
              className="text-orange-500 text-lg"
            />
          </span>
          <span className="font-bold text-lg">Top Categories</span>
        </div>
        <a
          href="/categories"
          className="text-sm font-medium text-blue-900 hover:underline"
        >
          View All
        </a>
      </div>
      <div className="flex flex-col items-center">
        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading...</div>
        ) : topCategories.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            No category sales found
          </div>
        ) : (
          <>
            <div className="flex items-center w-full justify-center">
              <PieChart width={220} height={220}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                  cornerRadius={24}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, idx) => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value.toLocaleString()} Sales`,
                    name,
                  ]}
                  contentStyle={{ borderRadius: 12, fontWeight: "bold" }}
                />
              </PieChart>
              <div className="flex flex-col gap-4 ml-8">
                {topCategories.map((cat, idx) => (
                  <div key={cat.id} className="flex flex-col items-start mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full`}
                        style={{ background: COLORS[idx % COLORS.length] }}
                      ></span>
                      <span className="font-medium text-gray-900 text-md">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 pl-4">
                      <span className="font-bold text-xl text-gray-900">
                        {cat.sales.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-xs">Sales</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full mt-8">
              <div className="font-bold text-md text-gray-900 mb-2 px-2">
                Category Statistics
              </div>
              <div className="border rounded-xl px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-purple-600"></span>
                  <span className="text-gray-700 font-medium flex-1">
                    Total Number Of Categories
                  </span>
                  <span className="font-bold text-gray-900">
                    {totalCategories.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-gray-700 font-medium flex-1">
                    Total Number Of Products
                  </span>
                  <span className="font-bold text-gray-900">
                    {totalProducts.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
