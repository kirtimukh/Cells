import { useContext } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

import { authContext } from "@/hooks/authProvider";

import {postNewClonedShareable} from "@/requests";
import { useCookies } from "react-cookie";


export default function NewShareableMenu({setShowJForm}) {
    const [cookies] = useCookies(['Authorization']);
    const { listOfPlayables, refreshCellLists } = useContext(authContext);

    const handleCloning = (jid) => {
        postNewClonedShareable(jid, cookies.Authorization)
        .then(data => {
            if (data.ok) { refreshCellLists(['shareables']); }
        })
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger tabIndex="-1" className="
            inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300
            border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50
            h-10 px-4 py-2">
                <strong>Add</strong>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Clone a jigsaw</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                    {listOfPlayables.map((item) => 
                        <DropdownMenuItem 
                            key={item.id}
                            onSelect={() => handleCloning(item.id)}
                        >{item.title}</DropdownMenuItem>
                    )}
                    </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onSelect={() => setShowJForm(true)}>Create from image</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
