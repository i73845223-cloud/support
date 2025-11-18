"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

const LowerNav = () => {
    const pathname = usePathname();

    if (pathname === '/profile') {
        return (
            <nav className="fixed z-20 bottom-0 grid grid-cols-4 lg:hidden sm:px-8 py-3 border-t-2 border-red-600 w-full bg-black text-md">
                <Link
                    href="/"
                    className='flex flex-col items-center'
                >
                    <img src="home.svg" alt="home" width={28} height={28} />
                    <p>Home</p>
                </Link>
                <Link
                    href="/transactions"
                    className='flex flex-col items-center'
                >
                    <img src="transactions.svg" alt="transactions" width={28} height={28} />
                    <p>Transactions</p>
                </Link>
                <Link
                    href="/support"
                    className='flex flex-col items-center'
                >
                    <img src="chats.svg" alt="chat" width={28} height={28} />
                    <p>Support</p>
                </Link>
                <Link
                    href="/profile"
                    className='flex flex-col items-center'
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM7.6 18.7C8.4 17 10.1 16 12 16C13.9 16 15.6 17 16.4 18.7C15.2 19.5 13.6 20 12 20C10.4 20 8.8 19.5 7.6 18.7ZM17.9 17.3C16.6 15.3 14.4 14 12 14C9.6 14 7.3 15.3 6.1 17.3C4.8 15.9 4 14.1 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 14.1 19.2 15.9 17.9 17.3ZM12 6C10.1 6 8.5 7.6 8.5 9.5C8.5 11.4 10.1 13 12 13C13.9 13 15.5 11.4 15.5 9.5C15.5 7.6 13.9 6 12 6ZM12 11C11.2 11 10.5 10.3 10.5 9.5C10.5 8.7 11.2 8 12 8C12.8 8 13.5 8.7 13.5 9.5C13.5 10.3 12.8 11 12 11Z" fill="#E11D48"></path>
                    </svg>
                    <p className="text-red-600">Profile</p>
                </Link>
            </nav>
        )
    } else if (pathname === '/support') {
        return (
            <nav className="fixed z-20 bottom-0 grid grid-cols-4 lg:hidden sm:px-8 py-3 border-t-2 border-red-600 w-full bg-black text-md">
                <Link
                    href="/"
                    className='flex flex-col items-center'
                >
                    <img src="home.svg" alt="home" width={28} height={28} />
                    <p>Home</p>
                </Link>
                <Link
                    href="/transactions"
                    className='flex flex-col items-center'
                >
                    <img src="transactions.svg" alt="transactions" width={28} height={28} />
                    <p>Transactions</p>
                </Link>
                <Link
                    href="/support"
                    className='flex flex-col items-center'
                >
                    <img src="chats-red.svg" alt="settings" width={28} height={28} />
                    <p className="text-red-600">Support</p>
                </Link>
                <Link
                    href="/profile"
                    className='flex flex-col items-center'
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM7.6 18.7C8.4 17 10.1 16 12 16C13.9 16 15.6 17 16.4 18.7C15.2 19.5 13.6 20 12 20C10.4 20 8.8 19.5 7.6 18.7ZM17.9 17.3C16.6 15.3 14.4 14 12 14C9.6 14 7.3 15.3 6.1 17.3C4.8 15.9 4 14.1 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 14.1 19.2 15.9 17.9 17.3ZM12 6C10.1 6 8.5 7.6 8.5 9.5C8.5 11.4 10.1 13 12 13C13.9 13 15.5 11.4 15.5 9.5C15.5 7.6 13.9 6 12 6ZM12 11C11.2 11 10.5 10.3 10.5 9.5C10.5 8.7 11.2 8 12 8C12.8 8 13.5 8.7 13.5 9.5C13.5 10.3 12.8 11 12 11Z" fill="#fff"></path>
                    </svg>
                    <p>Profile</p>
                </Link>
            </nav>
        )
    } else if (pathname === '/transactions') {
        return (
            <nav className="fixed z-20 bottom-0 grid grid-cols-4 lg:hidden sm:px-8 py-3 border-t-2 border-red-600 w-full bg-black text-md">
                <Link
                    href="/"
                    className='flex flex-col items-center'
                >
                    <img src="home.svg" alt="home" width={28} height={28} />
                    <p>Home</p>
                </Link>
                <Link
                    href="/transactions"
                    className='flex flex-col items-center'
                >
                    <img src="transactions-red.svg" alt="transactions" width={28} height={28} />
                    <p className="text-red-600">Transactions</p>
                </Link>
                <Link
                    href="/support"
                    className='flex flex-col items-center'
                >
                    <img src="chats.svg" alt="chats" width={28} height={28} />
                    <p>Support</p>
                </Link>
                <Link
                    href="/profile"
                    className='flex flex-col items-center'
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM7.6 18.7C8.4 17 10.1 16 12 16C13.9 16 15.6 17 16.4 18.7C15.2 19.5 13.6 20 12 20C10.4 20 8.8 19.5 7.6 18.7ZM17.9 17.3C16.6 15.3 14.4 14 12 14C9.6 14 7.3 15.3 6.1 17.3C4.8 15.9 4 14.1 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 14.1 19.2 15.9 17.9 17.3ZM12 6C10.1 6 8.5 7.6 8.5 9.5C8.5 11.4 10.1 13 12 13C13.9 13 15.5 11.4 15.5 9.5C15.5 7.6 13.9 6 12 6ZM12 11C11.2 11 10.5 10.3 10.5 9.5C10.5 8.7 11.2 8 12 8C12.8 8 13.5 8.7 13.5 9.5C13.5 10.3 12.8 11 12 11Z" fill="#fff"></path>
                    </svg>
                    <p>Profile</p>
                </Link>
            </nav>
        )
    } else {
        return (
            <nav className="fixed z-20 bottom-0 grid grid-cols-4 lg:hidden sm:px-8 py-3 border-t-2 border-red-600 w-full bg-black text-md">
                <Link
                    href="/slots"
                    className={`flex flex-col items-center ${pathname === '/slots' ? 'text-red-600' : ''}`}
                >
                    {pathname === '/slots' ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 19C3.5 19 3.3 19 3 19C1.9 19 1 18.1 1 17C1 14.5 1 9.5 1 7C1 5.9 1.9 5 3 5C3.2 5 3.5 5 3.5 5V6.8C3.5 6.8 3.3 6.8 3 6.8C2.9 6.8 2.8 6.9 2.8 7C2.8 9.5 2.8 14.5 2.8 17C2.8 17.1 2.9 17.2 3 17.2C3.2 17.2 3.5 17.2 3.5 17.2V19ZM21 5C20.9 5 20.5 5 20.5 5V6.8C20.5 6.8 20.9 6.8 21 6.8C21.1 6.8 21.2 6.9 21.2 7C21.2 9.5 21.2 14.5 21.2 17C21.2 17.1 21.1 17.2 21 17.2C20.9 17.2 20.5 17.2 20.5 17.2V19C20.5 19 20.9 19 21 19C22.1 19 23 18.1 23 17C23 14.5 23 9.5 23 7C23 5.9 22.1 5 21 5ZM8 5C7.4 5 7 5.4 7 6C7 9 7 15 7 18C7 18.6 7.4 19 8 19C10 19 14 19 16 19C16.6 19 17 18.6 17 18C17 15 17 9 17 6C17 5.4 16.6 5 16 5H8ZM16 3C17.7 3 19 4.3 19 6C19 9 19 15 19 18C19 19.7 17.7 21 16 21C14 21 10 21 8 21C6.3 21 5 19.7 5 18C5 15 5 9 5 6C5 4.3 6.3 3 8 3C10 3 14 3 16 3ZM11.832 15.4023C12.5984 13.832 13.8711 11.1992 14.6 9.7C14.8355 9.21569 14.5 8.7 14 8.7C13.0039 8.7 11.4 8.7 10.5 8.7C10.0195 8.7 9.7 9 9.7 9.4C9.7 9.8 10.0078 10.1 10.4 10.1C11 10.1 12.8 10.1 12.8 10.1C12.8 10.1 11.165 13.3913 10.5312 14.707C10.3748 15.0319 10.5 15.55 10.8 15.7C11.2 15.9 11.6741 15.7259 11.832 15.4023Z" fill="#E11D48"></path>
                        </svg>
                    ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 19C3.5 19 3.3 19 3 19C1.9 19 1 18.1 1 17C1 14.5 1 9.5 1 7C1 5.9 1.9 5 3 5C3.2 5 3.5 5 3.5 5V6.8C3.5 6.8 3.3 6.8 3 6.8C2.9 6.8 2.8 6.9 2.8 7C2.8 9.5 2.8 14.5 2.8 17C2.8 17.1 2.9 17.2 3 17.2C3.2 17.2 3.5 17.2 3.5 17.2V19ZM21 5C20.9 5 20.5 5 20.5 5V6.8C20.5 6.8 20.9 6.8 21 6.8C21.1 6.8 21.2 6.9 21.2 7C21.2 9.5 21.2 14.5 21.2 17C21.2 17.1 21.1 17.2 21 17.2C20.9 17.2 20.5 17.2 20.5 17.2V19C20.5 19 20.9 19 21 19C22.1 19 23 18.1 23 17C23 14.5 23 9.5 23 7C23 5.9 22.1 5 21 5ZM8 5C7.4 5 7 5.4 7 6C7 9 7 15 7 18C7 18.6 7.4 19 8 19C10 19 14 19 16 19C16.6 19 17 18.6 17 18C17 15 17 9 17 6C17 5.4 16.6 5 16 5H8ZM16 3C17.7 3 19 4.3 19 6C19 9 19 15 19 18C19 19.7 17.7 21 16 21C14 21 10 21 8 21C6.3 21 5 19.7 5 18C5 15 5 9 5 6C5 4.3 6.3 3 8 3C10 3 14 3 16 3ZM11.832 15.4023C12.5984 13.832 13.8711 11.1992 14.6 9.7C14.8355 9.21569 14.5 8.7 14 8.7C13.0039 8.7 11.4 8.7 10.5 8.7C10.0195 8.7 9.7 9 9.7 9.4C9.7 9.8 10.0078 10.1 10.4 10.1C11 10.1 12.8 10.1 12.8 10.1C12.8 10.1 11.165 13.3913 10.5312 14.707C10.3748 15.0319 10.5 15.55 10.8 15.7C11.2 15.9 11.6741 15.7259 11.832 15.4023Z" fill="#fff"></path>
                        </svg>
                    )}
                    <p>Slots</p>
                </Link>
                <Link
                    href="/roulette"
                    className={`flex flex-col items-center ${pathname === '/roulette' ? 'text-red-600' : ''}`}
                >
                    {pathname === '/roulette' ? (
                        <img src="roulette-red.svg" alt="roulette" width={28} height={28} />
                    ) : (
                        <img src="roulette.svg" alt="roulette" width={28} height={28} />
                    )}
                    <p>Roulette</p>
                </Link>
                <Link
                    href="/instant"
                    className={`flex flex-col items-center ${pathname === '/instant' ? 'text-red-600' : ''}`}
                >
                    {pathname === '/instant' ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.9819 1H21.7821L18.6848 1.6C17.4858 1.8 16.4867 2.4 15.5874 3.3L13.9888 4.9L7.69423 4.7H7.39449C5.79587 4.7 4.19725 5.3 3.09819 6.5L1 8.5L8.79329 12.3C9.99226 12.9 11.0913 13.9 11.6908 15.2L15.4875 23L17.5857 20.9C18.7847 19.7 19.4841 18 19.3842 16.3L19.0844 10L20.683 8.4C21.4824 7.5 22.0818 6.5 22.3816 5.3L22.9811 2.2C23.081 1.7 22.7812 1.1 22.1818 1C22.0818 1 22.0818 1 21.9819 1ZM4.49699 7.9C5.2963 7.1 6.29544 6.7 7.39449 6.7H7.59432L12.0904 6.9L8.8932 10.2L4.39707 8L4.49699 7.9ZM16.087 19.5L13.8889 15.1L17.1861 11.8L17.3859 16.4C17.3859 17.6 16.8863 18.7 16.087 19.5ZM20.3833 4.9C20.1835 5.7 19.7838 6.4 19.2843 7L18.385 7.9L12.8898 13.3C12.2903 12.4 11.5909 11.7 10.6917 11.1L16.087 5.7L16.9862 4.8C17.5857 4.2 18.2851 3.8 19.0844 3.7L20.683 3.4L20.3833 4.9ZM9.69251 14.3C10.6917 15.3 10.6917 16.9 9.69251 17.9C8.29372 19.3 5.39621 18.6 5.39621 18.6C5.39621 18.6 4.69682 15.7 6.09561 14.3C7.09475 13.3 8.69337 13.3 9.69251 14.3Z" fill="#E11D48"></path>
                        </svg>
                    ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.9819 1H21.7821L18.6848 1.6C17.4858 1.8 16.4867 2.4 15.5874 3.3L13.9888 4.9L7.69423 4.7H7.39449C5.79587 4.7 4.19725 5.3 3.09819 6.5L1 8.5L8.79329 12.3C9.99226 12.9 11.0913 13.9 11.6908 15.2L15.4875 23L17.5857 20.9C18.7847 19.7 19.4841 18 19.3842 16.3L19.0844 10L20.683 8.4C21.4824 7.5 22.0818 6.5 22.3816 5.3L22.9811 2.2C23.081 1.7 22.7812 1.1 22.1818 1C22.0818 1 22.0818 1 21.9819 1ZM4.49699 7.9C5.2963 7.1 6.29544 6.7 7.39449 6.7H7.59432L12.0904 6.9L8.8932 10.2L4.39707 8L4.49699 7.9ZM16.087 19.5L13.8889 15.1L17.1861 11.8L17.3859 16.4C17.3859 17.6 16.8863 18.7 16.087 19.5ZM20.3833 4.9C20.1835 5.7 19.7838 6.4 19.2843 7L18.385 7.9L12.8898 13.3C12.2903 12.4 11.5909 11.7 10.6917 11.1L16.087 5.7L16.9862 4.8C17.5857 4.2 18.2851 3.8 19.0844 3.7L20.683 3.4L20.3833 4.9ZM9.69251 14.3C10.6917 15.3 10.6917 16.9 9.69251 17.9C8.29372 19.3 5.39621 18.6 5.39621 18.6C5.39621 18.6 4.69682 15.7 6.09561 14.3C7.09475 13.3 8.69337 13.3 9.69251 14.3Z" fill="#fff"></path>
                        </svg>
                    )}
                    <p>Instant</p>
                </Link>
                <Link
                    href="/profile"
                    className={`flex flex-col items-center ${pathname === '/profile' ? 'text-red-600' : ''}`}
                >
                    {pathname === '/profile' ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM7.6 18.7C8.4 17 10.1 16 12 16C13.9 16 15.6 17 16.4 18.7C15.2 19.5 13.6 20 12 20C10.4 20 8.8 19.5 7.6 18.7ZM17.9 17.3C16.6 15.3 14.4 14 12 14C9.6 14 7.3 15.3 6.1 17.3C4.8 15.9 4 14.1 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 14.1 19.2 15.9 17.9 17.3ZM12 6C10.1 6 8.5 7.6 8.5 9.5C8.5 11.4 10.1 13 12 13C13.9 13 15.5 11.4 15.5 9.5C15.5 7.6 13.9 6 12 6ZM12 11C11.2 11 10.5 10.3 10.5 9.5C10.5 8.7 11.2 8 12 8C12.8 8 13.5 8.7 13.5 9.5C13.5 10.3 12.8 11 12 11Z" fill="#E11D48"></path>
                        </svg>
                    ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM7.6 18.7C8.4 17 10.1 16 12 16C13.9 16 15.6 17 16.4 18.7C15.2 19.5 13.6 20 12 20C10.4 20 8.8 19.5 7.6 18.7ZM17.9 17.3C16.6 15.3 14.4 14 12 14C9.6 14 7.3 15.3 6.1 17.3C4.8 15.9 4 14.1 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 14.1 19.2 15.9 17.9 17.3ZM12 6C10.1 6 8.5 7.6 8.5 9.5C8.5 11.4 10.1 13 12 13C13.9 13 15.5 11.4 15.5 9.5C15.5 7.6 13.9 6 12 6ZM12 11C11.2 11 10.5 10.3 10.5 9.5C10.5 8.7 11.2 8 12 8C12.8 8 13.5 8.7 13.5 9.5C13.5 10.3 12.8 11 12 11Z" fill="#fff"></path>
                        </svg>
                    )}
                    <p>Profile</p>
                </Link>
            </nav>
        );
    }
    
}
 
export default LowerNav;