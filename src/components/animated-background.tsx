
'use client';

import { useState, useEffect } from 'react';
import { Cpu, Binary, Shield, Fingerprint, Waypoints, Atom } from 'lucide-react';
import { cn } from '@/lib/utils';

const stickerData = [
    {
        component: <Binary size={32} />,
        positionClassName: 'left-[10%]',
        duration: 25,
        transform: 'rotate(-6deg)'
    },
    {
        component: <p className="font-mono text-sm">STREAM_V2</p>,
        positionClassName: 'left-[30%]',
        duration: 32,
        transform: 'rotate(4deg)'
    },
    {
        component: <Fingerprint size={28} />,
        positionClassName: 'left-[50%]',
        duration: 22,
        transform: 'rotate(8deg)'
    },
    {
        component: <p className="font-mono text-xs">NODE_VERIFIED</p>,
        positionClassName: 'left-[52%]',
        duration: 22,
        transform: 'rotate(8deg) translateY(30px)'
    },
    {
        component: <Waypoints size={32} />,
        positionClassName: 'left-[85%]',
        duration: 28,
        transform: 'rotate(-10deg)'
    },
    {
        component: <p className="font-mono text-2xl">01101001</p>,
        positionClassName: 'left-[0%]',
        duration: 40,
        transform: 'rotate(5deg)'
    },
    {
        component: <Shield size={28} />,
        positionClassName: 'left-[20%]',
        duration: 26,
        transform: 'rotate(-8deg)'
    },
     {
        component: <Cpu size={32} />,
        positionClassName: 'left-[75%]',
        duration: 23,
        transform: 'rotate(6deg)'
    },
    {
        component: <Atom size={28} />,
        positionClassName: 'left-[90%]',
        duration: 35,
        transform: 'rotate(12deg)'
    },
    {
        component: <p className="font-mono text-lg">BFS/DFS</p>,
        positionClassName: 'left-[40%]',
        duration: 29,
        transform: 'rotate(-7deg)'
    },
];

export function AnimatedBackground() {
    const [mountedStickers, setMountedStickers] = useState<any[]>([]);

    useEffect(() => {
        const generatedStickers = stickerData.map((sticker, index) => ({
            ...sticker,
            key: index,
            style: {
                animation: `float-up ${sticker.duration}s ease-in-out infinite`,
                animationDelay: `${Math.random() * -sticker.duration}s`,
            }
        }));
        setMountedStickers(generatedStickers);
    }, []);

    return (
        <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
            <div className="relative h-full w-full bg-background bg-grid-pattern">
                {mountedStickers.map((sticker) => (
                    <div
                        key={sticker.key}
                        className={cn(
                            'absolute bottom-[-20%] text-muted-foreground/20',
                            sticker.positionClassName
                        )}
                        style={sticker.style}
                    >
                        <div
                            style={{ transform: sticker.transform }}
                        >
                            {sticker.component}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
