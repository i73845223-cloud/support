"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

const HeaderNav = () => {
    const pathname = usePathname();
    
    return ( 
        <nav className="lg:flex justify-between max-w-[500px] w-full absolute left-1/2 transform -translate-x-1/2 hidden">
            <Link
                href="/chats"
                className={`flex gap-2 items-center ${pathname === '/chats' ? 'text-red-600' : ''}`}
            >
                <p>Chats</p>
            </Link>
            <Link
                href="/users"
                className={`flex gap-2 items-center ${pathname === '/users' ? 'text-red-600' : ''}`}
            >
                <p>Users</p>
            </Link>
            <Link
                href="/transactions"
                className={`flex gap-2 items-center ${pathname === '/transactions' ? 'text-red-600' : ''}`}
            >
                <p>Transactions</p>
            </Link>
            <Link
                href="/promo"
                className={`flex gap-2 items-center ${pathname === '/promo' ? 'text-red-600' : ''}`}
            >
                <p>Promo</p>
            </Link>
            <Link
                href="/influencer"
                className={`flex gap-2 items-center ${pathname === '/influencer' ? 'text-red-600' : ''}`}
            >
                <p>Influencer</p>
            </Link>
        </nav>
    );
}
 
export default HeaderNav;