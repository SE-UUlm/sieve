"use client";

import { Button } from "@/components/primitives/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/primitives/card";
import { Field } from "@/components/primitives/field";
import useLogout from "@/hooks/useLogout";

const AlreadyLoggedIn = () => {
    const { isPending, logout } = useLogout();

    return (
        <Card className="mx-auto w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>You are already logged in</CardTitle>
            </CardHeader>
            <CardContent>
                <Field orientation="horizontal">
                    <Button type="button" onClick={logout} disabled={isPending}>
                        Logout
                    </Button>
                </Field>
            </CardContent>
        </Card>
    );
};

export default AlreadyLoggedIn;
