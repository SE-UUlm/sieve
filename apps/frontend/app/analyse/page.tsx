import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const AnalysePage = () => (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 p-4 lg:p-24">
        <form className="flex flex-col gap-4">
            <h1>Analyse Email</h1>
            <Textarea placeholder="Paste your email here" />
            <Button size="lg">Analyse</Button>
        </form>
        <div className="flex flex-col gap-4">
            <h2>Result</h2>
            <Textarea readOnly />
        </div>
    </main>
);

export default AnalysePage;
