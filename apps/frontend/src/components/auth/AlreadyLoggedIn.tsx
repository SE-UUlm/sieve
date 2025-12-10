"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import useLogout from "@/hooks/useLogout";

const AlreadyLoggedIn = () => {
    const { isPending, mutate: handleLogout } = useLogout();

    return (
        <Card className="mx-auto w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>You are already logged in</CardTitle>
            </CardHeader>
            <CardContent>
                <Field orientation="horizontal">
                    <Button type="button" onClick={() => handleLogout()} disabled={isPending}>
                        Logout
                    </Button>
                </Field>
            </CardContent>
        </Card>
    );
};

export default AlreadyLoggedIn;
