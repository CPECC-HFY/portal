import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "edge";

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <div className="text-center space-y-6">
                <h1 className="text-8xl font-black text-primary/20">404</h1>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
                    <p className="text-muted-foreground max-w-[500px] mx-auto">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>
                <Button asChild className="rounded-full">
                    <Link href="/">Back to Dashboard</Link>
                </Button>
            </div>
        </div>
    );
}
