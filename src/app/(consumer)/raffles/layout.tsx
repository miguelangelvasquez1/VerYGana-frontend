import RafflesSidebar from "@/components/consumer/raffles/RafflesSidebar";

export default function RifasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full flex justify-end">

            <div className="w-full flex max-w-full gap-6 p-4">

                <main className="flex-1 min-w-0">
                    {children}
                </main>
                
                <aside className="hidden xl:block w-[320px]">
                    <div className="sticky top-24 space-y-4">
                        <RafflesSidebar />
                    </div>
                </aside>

            </div>
        </div>
    );
}