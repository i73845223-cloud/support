import Header from "@/app/(main)/_components/header";
import LowerNav from "./_components/lower-nav";

const MainLayout = ({ children }: {children: React.ReactNode}) => {
    return ( 
        <>
            <Header />
            <main className="md:pt-[66px] pt-[50px]">
                {children}
            </main>
        </>
    );
}
 
export default MainLayout;