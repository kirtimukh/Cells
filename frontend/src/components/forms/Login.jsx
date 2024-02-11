import { useRef, useState } from 'react'
import { useCookies } from 'react-cookie';

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

import apiClient from '@/interceptors'

import { apiUrl } from '@/constants';


function LoginForm({ showLForm, setShowLForm, setShowRForm }) {
    const [cookies, setCookie] = useCookies(['Authorization']);

    const onOpenChange = (e) => {
        if (showLForm) { setShowLForm(false) }
    }

    const myInputRef = useRef();
    const [message, setMessage] = useState('')

    const tryRegister = (e) => {
        setShowLForm(false)
        setShowRForm(true)
    }

    const requestLogin = (e) => {
        e.preventDefault()
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        let loginCredentials = new FormData();
        loginCredentials.append('username', email);
        loginCredentials.append('password', password);
        loginCredentials.append('grant-type', 'password');

        apiClient({
            method: 'post',
            url: `${apiUrl}/auth/jwt/login`,
            data: loginCredentials,
            headers: { "Content-Type": "multipart/form-data" }
        })
            .then(function (response) {
                const token = `Bearer ${response.data.access_token}`
                localStorage.clear()
                setCookie(
                    'Authorization',
                    token,
                    {
                        secure: import.meta.env.VITE_COOKIE_SECURE === "true",
                    }
                );
                setShowLForm(false)
            })
            .catch(function (error) {
                console.error('Error:', error);
                setMessage('Invalid username or password')
            });
    }


    return (
        <Dialog defaultOpen={false} open={showLForm} onOpenChange={onOpenChange} >
            <DialogContent className="sm:max-w-[425px]" id="loginForm" onKeyDown={(e) => { e.stopPropagation(); }} onOpenAutoFocus={(event) => {
    event.preventDefault(); // Prevent Radix's default focus
    requestAnimationFrame(() => {
      myInputRef.current?.focus(); // Manually move focus
    });
  }}>
                <DialogHeader>
                    <DialogTitle>Login</DialogTitle>
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
                            ref={myInputRef}
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
                </div>
                <DialogFooter>
                    <Button type="submit" variant="ghost" onClick={(e) => tryRegister(e)}>Register</Button>
                    <Button type="submit" onClick={(e) => requestLogin(e)}>Login</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default LoginForm;