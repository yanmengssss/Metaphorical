/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const schema = z.object({
    label: z.string().min(1, "Label is required"),
    messageTypes: z.array(z.object({
        key: z.string().min(1, "Key is required"),
        label: z.string().min(1, "Label is required")
    })).min(1, "At least one message type is required"),
    columns: z.array(z.object({
        key: z.string().min(1, "Key is required"),
        label: z.string().optional(),
        type: z.enum(["string", "number", "boolean", "date"]),
        defaultValue: z.string().optional()
    }))
});

type TableFormValues = z.infer<typeof schema>;

interface EditTableDialogProps {
    table: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditTableDialog({
    table,
    open,
    onOpenChange,
    onSuccess,
}: EditTableDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<TableFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            label: "",
            messageTypes: [{ key: "", label: "" }],
            columns: []
        }
    });

    useEffect(() => {
        if (table && open) {
            form.reset({
                label: table.label || "",
                messageTypes: table.messageTypes?.length ? table.messageTypes.map((mt: any) => ({ key: mt.key, label: mt.label })) : [{ key: "", label: "" }],
                columns: table.columns?.length ? table.columns.map((col: any) => ({
                    key: col.key,
                    label: col.label || "",
                    type: col.type || "string",
                    defaultValue: col.defaultValue || ""
                })) : []
            });
        }
    }, [table, open, form]);

    const { fields: messageTypeFields, append: appendMessageType, remove: removeMessageType } = useFieldArray({
        control: form.control,
        name: "messageTypes"
    });

    const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({
        control: form.control,
        name: "columns"
    });

    const handleSubmit = async (values: TableFormValues) => {
        if (!table) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/tables/${table._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const data = await res.json();

            if (data.code === 200) {
                toast.success("Table updated successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(data.msg);
            }
        } catch (error) {
            toast.error("Failed to update table");
        } finally {
            setLoading(false);
        }
    };

    if (!table) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Table Configuration</DialogTitle>
                    <DialogDescription>
                        Update the table structure for {table.key}.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <Form {...form}>
                        <form id="edit-table-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
                            <div className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="label"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Table Name (Label)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Error Logs" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Message Types</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendMessageType({ key: "", label: "" })}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Type
                                    </Button>
                                </div>
                                {messageTypeFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-start">
                                        <FormField
                                            control={form.control}
                                            name={`messageTypes.${index}.label`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="Label (e.g. Critical)" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`messageTypes.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="Key (e.g. critical)" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-0.5 text-red-500 hover:text-red-700"
                                            onClick={() => removeMessageType(index)}
                                            disabled={messageTypeFields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {form.formState.errors.messageTypes?.root && (
                                    <p className="text-sm text-red-500">{form.formState.errors.messageTypes.root.message}</p>
                                )}
                            </div>

                            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Columns (Fields)</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendColumn({ key: "", label: "", type: "string" })}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Column
                                    </Button>
                                </div>
                                {columnFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-start">
                                        <FormField
                                            control={form.control}
                                            name={`columns.${index}.label`}
                                            render={({ field }) => (
                                                <FormItem className="flex-[2]">
                                                    <FormControl>
                                                        <Input placeholder="Label" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`columns.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem className="flex-[2]">
                                                    <FormControl>
                                                        <Input placeholder="Key" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`columns.${index}.type`}
                                            render={({ field }) => (
                                                <FormItem className="flex-[1.5]">
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="string">String</SelectItem>
                                                            <SelectItem value="number">Number</SelectItem>
                                                            <SelectItem value="boolean">Boolean</SelectItem>
                                                            <SelectItem value="date">Date</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-0.5 text-red-500 hover:text-red-700"
                                            onClick={() => removeColumn(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-table-form" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

