import { useContext, useEffect, useState } from "react";

import {
    Table,
    Header,
    HeaderRow,
    Body,
    Row,
    HeaderCell,
    Cell,
} from "@table-library/react-table-library/table";

import {
    useSort,
    HeaderCellSort,
  } from "@table-library/react-table-library/sort";

import {
HeaderCellSelect,
CellSelect,
SelectClickTypes,
SelectTypes,
useRowSelect,
} from "@table-library/react-table-library/select";
import { useTheme } from "@table-library/react-table-library/theme";

import {copy} from "@/assets/images"
import { useCookies } from 'react-cookie';

import NewJigsawForm from '@/components/forms/JigsawForm'
import NewShareableMenu from '@/components/nav/CloneOrCreate'
import { uiUrl } from '@/constants';
import { debounce, debounceAsync } from '../utils/GeneralUtils';
import { postMessageOfCompletion } from '@/requests'
import ConfirmDelete from '@/components/alert/ConfirmDelete'
import {authContext} from '@/hooks/authProvider'

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


function TooltipDemo({triggerElement}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {triggerElement}
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy shareable link</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}


const shareablesTableTheme = useTheme({
    Table: `
        --data-table-library_grid-template-columns: 40px 140px 110px 130px 210px 110px;
        padding: 30px;
    `,
    
    Row: `
        :hover {
            background-color: rgb(241 245 249);
        }  
    `,

    HeaderCell: `
        padding: 5px 5px;
    `,

    Cell: `
        padding: 0 5px;
    `
});


const debouncedPostMOC = debounceAsync(postMessageOfCompletion, 800)


const statusColorMap = {
    viewed: "bg-lime-300",
    checkedin: "bg-lime-500",
    expired: "bg-red-400",
    completed: "bg-green-400",
    active: "bg-sky-400",
    inactive: "bg-slate-400"
}


function formatUtcToLocalTime(utcString) {
    if (!utcString) return ''
    // Normalize to proper ISO format: trim to 3-digit milliseconds
    const normalized = utcString.replace(/(\.\d{3})\d+/, '$1');

    // Parse as UTC using Date
    const date = new Date(normalized + 'Z'); // Add 'Z' to force UTC parsing

    const day = date.getDate();
    const monthShort = date.toLocaleString('default', { month: 'short' });

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12 || 12;

    return `${day}${monthShort}, ${hours}:${minutes}${ampm}`;
}


import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card"

function HoverCardDemo({item}) {
    const rowStyle = "grid grid-cols-5 gap-1"
    const labelStyle = "col-span-2 text-sm text-right"
    const valStyle = "col-span-3 text-sm text-left"
    
  return (
    <HoverCard defaultOpen={false} openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
            <p className={"inline-block "+statusColorMap[item.status]}>{item.status}</p>
        </HoverCardTrigger>
        <HoverCardContent className="grid py-3 px-0" avoidCollisions={false} side={'right'}>
                <div className={rowStyle}>
                    <div className={labelStyle}>created:</div>
                    <div className={valStyle}>{formatUtcToLocalTime(item.do_activation)}</div>
                </div>
                <div className={rowStyle}>
                    <div className={labelStyle}>viewed:</div>
                    <div className={valStyle}>{formatUtcToLocalTime(item.do_firstview)}</div>
                </div>
                <div className={rowStyle}>
                    <div className={labelStyle}>completed:</div>
                    <div className={valStyle}>{formatUtcToLocalTime(item.do_completion)}</div>
                </div>
        </HoverCardContent>
    </HoverCard>
  )
}


const ShareablesList = ({listOfImages, listOfShareables}) => {
    const {refreshCellLists, updateShareablesMessage, JState} = useContext(authContext)
    const [cookies] = useCookies(['Authorization']);
    const data = {'nodes': listOfShareables}
    const [showJForm, setShowJForm] = useState(false)

    const handleUpdate = (value, id) => {
        setData((state) => ({
        ...state,
        nodes: state.nodes.map((node) => {
            if (node.id === id) {
            return { ...node, name: value };
            } else {
            return node;
            }
        }),
        }));
    };

    const [messagesState, setMessagesState] = useState({})

    useEffect(() => {
        if (listOfShareables) {
            const theDictionary = Object.fromEntries(listOfShareables.map(item => [item.id, item.message_of_completion]))
            setMessagesState(theDictionary)
        }
    }, [listOfShareables])


    function onSortChange(action, state) {}

    const sort = useSort(
        data,
        {onChange: onSortChange,},
        {
        sortFns: {
            // SLNO: (array) => array.sort((a, b) => a.slno - b.slno),
            IMAGE: (array) => array.sort((a, b) => a.image_title.localeCompare(b.image_title)),
            OPENED_AT: (array) => array.sort((a, b) => a.deadline - b.deadline),
            STATUS: (array) => array.sort((a, b) => a.status.localeCompare(b.status)),
        },
        }
    );

    const select = useRowSelect(
        data,
        {
            onChange: onSelectChange,
        },
        {
            // rowSelect: SelectTypes.MultiSelect,
            // buttonSelect: SelectTypes.MultiSelect,
            clickType: SelectClickTypes.ButtonClick,
        }
    );

    function onSelectChange(action, state) {
        // console.log(state.ids);
    }

    function updateMessageOfCompletion(msg, id) {
        setMessagesState(prev => ({
            ...prev, [id]: msg
        }))

        debouncedPostMOC(id, {message_of_completion: msg}, cookies.Authorization)
        .then(data => { if (data.ok) { updateShareablesMessage(id, msg) } })
    }

    const [displayAlert, setDisplayAlert] = useState(false)
    const deleteShareables = () => {
        if (select.state.ids.length > 0) {setDisplayAlert(true)}
    }


    return (<>
    <div>
        <div className="border-slate-200 border-2">

            <Table data={data} layout={{ custom: true }}  theme={shareablesTableTheme} sort={sort} select={select} >
                {(tableList) => (
                <>
                    <Header>
                    <HeaderRow>
                        <HeaderCellSelect />
                        {/* <HeaderCellSort sortKey="SLNO">sl no.</HeaderCellSort> */}
                        <HeaderCell>identifier</HeaderCell>
                        <HeaderCellSort sortKey="IMAGE">image</HeaderCellSort>
                        <HeaderCell>url</HeaderCell>
                        <HeaderCell>winning message</HeaderCell>
                        <HeaderCellSort sortKey="STATUS">status</HeaderCellSort>
                    </HeaderRow>
                    </Header>

                    <Body>
                    {tableList.map((item, slno) => (
                        <Row key={item.id} item={item} className={item.status === "Expired"? "text-slate-500": ""}>

                        <CellSelect item={item} />
                        <Cell>{item.title}</Cell>
                        <Cell>{item.image_title}</Cell>

                        <Cell>
                            <div className="flex">
                            <TooltipDemo triggerElement={
                                <button className="flex" type="button" onClick={() => navigator.clipboard.writeText(`${uiUrl}/shared/${item.id}`)}>
                                    <img style={{ width: '17px', height: '17px' }} src={copy} alt="copy" />
                                </button>
                            }/>
                                
                                <span className="ml-1 w-[80px]">{`${uiUrl}/shared/${item.id}`}</span>
                            </div>
                        </Cell>

                        <Cell>
                            {
                                // item.status === "inactive"
                                // ? <input
                                //     className="border-slate-100 border-2"
                                //     style={{ width: "100%" }}
                                //     type="text"
                                //     value={messagesState[item.id]}
                                //     onChange={(event) => console.log(event.target.value, item.id)}
                                // />
                                // : item.message_of_completion
                                <input
                                    className="border-slate-100 border-2"
                                    style={{ width: "100%" }}
                                    type="text"
                                    maxLength={100}
                                    value={messagesState[item.id] ?? 'default value'}
                                    onChange={(event) => updateMessageOfCompletion(event.target.value, item.id)}
                                />
                            }
                        </Cell>

                        <Cell><HoverCardDemo item={item} /></Cell>

                        </Row>
                    ))}
                    </Body>
                </>
                )}
            </Table>

            <div className="flex justify-end">
            <div>
                <NewShareableMenu setShowJForm={setShowJForm} />
                <Button variant="outline" onClick={() => {refreshCellLists(['shareables'])}}><strong>Refresh</strong></Button>
                <Button variant="outline" onClick={deleteShareables}><strong>Delete</strong></Button>
            </div>
            </div>

        </div>

        <div className="text-sm px-3">
            <ul>
                <li>
                    *Uploading images costs 5 credits.
                </li>
                <li>
                    *Creating shareables from existing images requires 5 credits. 
                </li>
                <li>
                    *Creating shareables by cloning jigsaws requires 2 credits. 
                </li>
                {
                    JState.user?.is_verified ? null :
                <>  
                    <li>
                        *50 additional credits for verified emails.
                    </li>
                </>
                }
                
            </ul>
        </div>

        </div>

        {displayAlert?<ConfirmDelete objIds={select.state.ids} displayAlert={displayAlert} setDisplayAlert={setDisplayAlert} objType="shareables"/>:null}
        {showJForm?<NewJigsawForm formFor="shareables" showJForm={showJForm} setShowJForm={setShowJForm}/>:null}

    </>);
};

export default ShareablesList;