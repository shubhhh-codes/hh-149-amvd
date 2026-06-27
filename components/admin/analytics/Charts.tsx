import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#FF6B1A', '#FF9F66', '#FFD1B3', '#333333'];

export function RevenueTrendChart({ data, onDataClick }: { data: any[], onDataClick: (item: any) => void }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} onClick={(e: any) => e && e.activePayload && onDataClick(e.activePayload[0].payload)}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B1A" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF6B1A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="date" stroke="#ffffff50" fontSize={10} tickMargin={10} />
          <YAxis stroke="#ffffff50" fontSize={10} tickFormatter={(val) => `₹${val}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#131313', borderColor: '#ffffff20', borderRadius: '8px' }}
            itemStyle={{ color: '#FF6B1A' }}
            formatter={(value: any) => [`₹${value}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="revenue" stroke="#FF6B1A" fillOpacity={1} fill="url(#colorRev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TierSalesPieChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#131313', borderColor: '#ffffff20', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BeforeAfterBarChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} />
          <YAxis stroke="#ffffff50" fontSize={10} />
          <Tooltip 
            cursor={{fill: '#ffffff05'}}
            contentStyle={{ backgroundColor: '#131313', borderColor: '#ffffff20', borderRadius: '8px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Old" fill="#555555" radius={[4, 4, 0, 0]} />
          <Bar dataKey="New" fill="#FF6B1A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
