import { useRef, useState } from "react"

import { useDrawer } from "@/hooks/use-drawer"

import { AppWindowIcon, CodeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import Draggable from 'react-draggable';


import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function Footer() {
  const { showDrawer, toggleDrawer } = useDrawer()

  const nodeRef = useRef(null);
  const [position, setPosition] = useState({x:0, y:0})
  const handleOnDrag = (e, newPos) => {
    setPosition({
      x: newPos.x, y: newPos.y
    })
  }

  return (
    <Drawer open={showDrawer} onOpenChange={toggleDrawer}>
      <DrawerContent>
        <DrawerHeader className={"p-1"}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <Tabs defaultValue="account" className="px-5">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="h-[300px] w-full">
            {/* <div className="absolute h-[300px] w-full">
              <Draggable
                defaultClassNameDragging="isDragged"
                bounds="parent"
                nodeRef={nodeRef}
                onDrag={handleOnDrag}
                position={{ x: position.x, y: position.y }}
              >
                <div
                className="absolute"
                ref={nodeRef}
                tabIndex="-1"
                style={{width: '157px', height: '157px'}}
                >
                  <img src={dc1} alt="" style={{ rotate: '270deg' }} className="origin-top-left" draggable={false}/>
                </div>

              </Draggable>

              <img src={dc2} alt="" style={{ scale: '0.5' }} className="absolute right-0 top-0" />
            </div> */}
          </TabsContent>
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password here. After saving, you&apos;ll be logged
                  out.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-current">Current password</Label>
                  <Input id="tabs-demo-current" type="password" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-new">New password</Label>
                  <Input id="tabs-demo-new" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}



export default Footer;
