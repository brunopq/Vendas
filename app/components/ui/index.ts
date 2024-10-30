import { Button } from "./button"
import { Checkbox } from "./checkbox"
import * as BaseDialog from "./dialog"
import * as BaseDropdownMenu from "./dropdown-menu"
import { Input, BrlInput } from "./input"
import * as BaseRadioGroup from "./radio-group"
import * as BaseSelect from "./select"
import * as BaseTable from "./table"
import { Textarea } from "./textarea"
import * as BaseTabs from "./tabs"
import * as BasePopover from "./popover"

const Dialog = {
  Root: BaseDialog.Dialog,
  Close: BaseDialog.DialogClose,
  Content: BaseDialog.DialogContent,
  Description: BaseDialog.DialogDescription,
  Footer: BaseDialog.DialogFooter,
  Header: BaseDialog.DialogHeader,
  Overlay: BaseDialog.DialogOverlay,
  Portal: BaseDialog.DialogPortal,
  Title: BaseDialog.DialogTitle,
  Trigger: BaseDialog.DialogTrigger,
}

const DropdownMenu = {
  Root: BaseDropdownMenu.DropdownMenu,
  CheckboxItem: BaseDropdownMenu.DropdownMenuCheckboxItem,
  Content: BaseDropdownMenu.DropdownMenuContent,
  Group: BaseDropdownMenu.DropdownMenuGroup,
  Item: BaseDropdownMenu.DropdownMenuItem,
  Label: BaseDropdownMenu.DropdownMenuLabel,
  Portal: BaseDropdownMenu.DropdownMenuPortal,
  RadioGroup: BaseDropdownMenu.DropdownMenuRadioGroup,
  RadioItem: BaseDropdownMenu.DropdownMenuRadioItem,
  Separator: BaseDropdownMenu.DropdownMenuSeparator,
  Shortcut: BaseDropdownMenu.DropdownMenuShortcut,
  Sub: BaseDropdownMenu.DropdownMenuSub,
  SubContent: BaseDropdownMenu.DropdownMenuSubContent,
  SubTrigger: BaseDropdownMenu.DropdownMenuSubTrigger,
  Trigger: BaseDropdownMenu.DropdownMenuTrigger,
}

const RadioGroup = {
  Root: BaseRadioGroup.RadioGroup,
  Item: BaseRadioGroup.RadioGroupItem,
}

const Select = {
  Root: BaseSelect.Select,
  Content: BaseSelect.SelectContent,
  Group: BaseSelect.SelectGroup,
  Item: BaseSelect.SelectItem,
  Label: BaseSelect.SelectLabel,
  ScrollDownButton: BaseSelect.SelectScrollDownButton,
  ScrollUpButton: BaseSelect.SelectScrollUpButton,
  Separator: BaseSelect.SelectSeparator,
  Trigger: BaseSelect.SelectTrigger,
  Value: BaseSelect.SelectValue,
}

const Table = {
  Root: BaseTable.Table,
  Body: BaseTable.TableBody,
  Caption: BaseTable.TableCaption,
  Cell: BaseTable.TableCell,
  Footer: BaseTable.TableFooter,
  Head: BaseTable.TableHead,
  Header: BaseTable.TableHeader,
  Row: BaseTable.TableRow,
}

const Tabs = {
  Root: BaseTabs.Tabs,
  List: BaseTabs.TabsList,
  Trigger: BaseTabs.TabsTrigger,
  Content: BaseTabs.TabsContent,
}

const Popover = {
  Root: BasePopover.Popover,
  Content: BasePopover.PopoverContent,
  Trigger: BasePopover.PopoverTrigger,
}

export {
  Button,
  Checkbox,
  Dialog,
  DropdownMenu,
  Input,
  BrlInput,
  RadioGroup,
  Select,
  Table,
  Textarea,
  Tabs,
  Popover,
}
