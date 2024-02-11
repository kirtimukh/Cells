import { useState } from 'react'
import { useCookies } from 'react-cookie';
import apiClient from '@/interceptors'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogDescription } from '@radix-ui/react-dialog'

import { apiUrl } from '@/constants';


function RegistrationForm({ showRForm, setShowRForm, setShowLForm }) {
    const [cookies, setCookie] = useCookies(['Authorization']);

    const onOpenChange = () => {
        if (showRForm) {
            setShowRForm(false)
        }
    }
    const tryLogin = () => {
        setShowRForm(false)
        setShowLForm(true)
    }

    const [message, setMessage] = useState('')

    const requestRegistration = (e) => {
        e.preventDefault()
        const password = document.getElementById('password').value
        if (password.length < 8) {setMessage("Password should have at least 8 characters"); return}
        const email = document.getElementById('email').value

        let registrationData = new FormData();
        registrationData.append('email', email);
        registrationData.append('password', password);

        registrationData = {
            email: email,
            password: password,
        }

        apiClient({
            method: 'post',
            url: `${apiUrl}/auth/register`,
            data: registrationData,
        })
        .then(function (response) {
            let loginCredentials = new FormData();
            loginCredentials.append('username', registrationData.email);
            loginCredentials.append('password', registrationData.password);
            loginCredentials.append('grant-type', 'password');

            return apiClient({
                method: 'post',
                url: `${apiUrl}/auth/jwt/login`,
                data: loginCredentials,
                headers: { "Content-Type": "multipart/form-data" }
            })
        })
        .then(response => {
            const token = `Bearer ${response.data.access_token}`
            localStorage.clear()
            setCookie(
                'Authorization',
                token,
                {
                    secure: import.meta.env.VITE_COOKIE_SECURE === "true",
                }
            );
            setShowRForm(false);
        })
        .catch(function (error) {
            console.error('Error:', error);
            setMessage('Invalid username or password')
        });
    }

    return (
        <Dialog defaultOpen={false} open={showRForm} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" id="loginForm" onKeyDown={(e) => { e.stopPropagation(); }}>
                <DialogHeader>
                    <DialogTitle>Registration</DialogTitle>
                    <DialogDescription
                        className='text-red-600 text-sm'
                    >
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            placeholder="strawhat@sunny.op"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="***********"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="re-password" className="text-right">
                            Repeat Password
                        </Label>
                        <Input
                            id="re-password"
                            type="password"
                            placeholder="***********"
                            className="col-span-3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogDescription
                        className='text-gray-500 text-xs'
                    >
                    </DialogDescription>
                    <Button type="submit" variant="ghost" onClick={(e) => tryLogin(e)}>Login</Button>
                    <Button type="submit" onClick={(e) => requestRegistration(e)}>Register</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default RegistrationForm;