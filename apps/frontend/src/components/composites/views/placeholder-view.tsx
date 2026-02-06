import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/primitives/card";

type PlaceholderViewProps = {
    title: string;
    description: string;
};

// TODO: Delete this component once Analyze, History, and Settings views are fully implemented.
export function PlaceholderView({ title, description }: PlaceholderViewProps) {
    return (
        <section className="flex h-full w-full items-center justify-center p-8 md:p-12">
            <Card className="w-full max-w-xl border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-base text-slate-500 dark:text-slate-400">
                        {description}
                    </CardDescription>
                </CardHeader>
            </Card>
        </section>
    );
}
