"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/primitives/card";
import { Field } from "@/components/primitives/field";
import { Spinner } from "@/components/primitives/spinner";

const SessionLoading = () => {
    return (
        <Card className="mx-auto w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Checking your session</CardTitle>
            </CardHeader>
            <CardContent>
                <Field orientation="horizontal">
                    <Spinner className="size-4" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Loading authentication state...
                    </p>
                </Field>
            </CardContent>
        </Card>
    );
};

export default SessionLoading;
