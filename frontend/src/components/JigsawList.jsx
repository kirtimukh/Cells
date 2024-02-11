import { useContext, useState } from "react";

import { Button } from "@/components/ui/button"

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
    SelectTypes,
    useRowSelect,
} from "@table-library/react-table-library/select";

import { useTheme } from "@table-library/react-table-library/theme";

import NewJigsawForm from '@/components/forms/JigsawForm'
import ConfirmDelete from '@/components/alert/ConfirmDelete'

import {authContext} from '@/hooks/authProvider'


const theme = useTheme({
    Table: `
        --data-table-library_grid-template-columns: 80px repeat(2, minmax(0, 1fr));
        padding: 15px;
    `,
    
    Row: `
        :hover {
            background-color: rgb(241 245 249);
        }  
    `
    });


const JigsawList = ({ listOfImages, listOfPlayables }) => {
    // const dataObj = {'nodes': listOfPlayables.filter(obj => obj.visibility === 'closed')}
    const {refreshCellLists, JState} = useContext(authContext)
    const dataObj = {'nodes': listOfPlayables}
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

    function onSortChange(action, state) {}

    const sort = useSort(
        dataObj,
        {onChange: onSortChange,},
        {
        sortFns: {
            // SLNO: (array) => array.sort((a, b) => a.slno - b.slno),
            IMAGE: (array) => array.sort((a, b) => a.image_title.localeCompare(b.image_title)),
            OPENED_AT: (array) => array.sort((a, b) => a.deadline - b.deadline),
            EXPIRES_AT: (array) => array.sort((a, b) => a.deadline - b.deadline),
            STATUS: (array) => array.sort((a, b) => a.status.localeCompare(b.status)),
        },
        }
    );

    const select = useRowSelect(
        dataObj,
        {
            onChange: onSelectChange,
        },
        {
            rowSelect: SelectTypes.MultiSelect,
            buttonSelect: SelectTypes.MultiSelect,
        }
    );

    function onSelectChange(action, state) {
    //     console.log(action, state);
    }

    const [displayAlert, setDisplayAlert] = useState(false)
    const deleteJigsaws = () => {
        if (select.state.ids.length > 0) {setDisplayAlert(true)}
    }

    return (<>
        <div>
        <div className="border-slate-200 border-2">

        <Table data={dataObj} layout={{ custom: true }} sort={sort} select={select} theme={theme} >
            {(tableList) => (
            <>
                <Header>
                <HeaderRow>
                    <HeaderCellSelect />
                    {/* <HeaderCellSort sortKey="SLNO">sl no.</HeaderCellSort> */}
                    <HeaderCellSort resize sortKey="IMAGE">image</HeaderCellSort>
                    <HeaderCellSort resize sortKey="IMAGE">jigsaw</HeaderCellSort>
                    {/* <HeaderCellSort sortKey="OPENED_AT">viewed on</HeaderCellSort> */}
                    {/* <HeaderCellSort sortKey="EXPIRES_AT">expires on</HeaderCellSort> */}
                </HeaderRow>
                </Header>

                <Body>
                {tableList.map((item, index) => (
                    <Row key={item.id} item={item} >

                        <CellSelect item={item} />
                        {/* <Cell >{index + 1}</Cell> */}
                        <Cell>{item.image_title}</Cell>
                        <Cell>{item.title}</Cell>

                        {/* <Cell>
                            {
                            item.opened_at
                            // .toLocaleDateString("en-US", {
                            //   year: "numeric",
                            //   month: "2-digit",
                            //   day: "2-digit",
                            // })
                            }
                        </Cell>

                        <Cell>
                            {item.expires_on
                            // .toLocaleDateString("en-US", {
                            //   year: "numeric",
                            //   month: "2-digit",
                            //   day: "2-digit",
                            // })
                            }
                        </Cell> */}

                    </Row>
                ))}
                </Body>
            </>
            )}
        </Table>

        <div className="h-2"></div>

        <div className="flex justify-end">
        <div>
            <Button variant="outline" onClick={() => setShowJForm(true)}><strong>Add</strong></Button>
            <Button variant="outline" onClick={() => {refreshCellLists(['images', 'playables'])}}><strong>Refresh</strong></Button>
            <Button variant="outline" onClick={deleteJigsaws}><strong>Delete</strong></Button>
        </div>
        </div>

        </div>

        <div className="text-sm px-3">
            <ul>
                <li>
                    *Uploading images costs 5 credits.
                </li>
                <li>
                    *Creating jigsaws from existing images requires 5 credits. 
                </li>
                {
                    JState.user?.is_verified ? null :
                <li>
                    *50 additional credits for verified emails.
                </li>
                }
            </ul>
        </div>

        </div>

        <ConfirmDelete objIds={select.state.ids} displayAlert={displayAlert} setDisplayAlert={setDisplayAlert} objType="jigsaw"/>
        {showJForm && <NewJigsawForm formFor="playables" showJForm={showJForm} setShowJForm={setShowJForm}/>}
    </>);
};

export default JigsawList;