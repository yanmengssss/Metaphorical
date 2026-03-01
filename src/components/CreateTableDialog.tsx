/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
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
  key: z.string().min(1, "Key is required"),
  label: z.string().min(1, "Label is required"),
  messageTypes: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    label: z.string().min(1, "Label is required")
  })).min(1, "At least one message type is required"),
  columns: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    label: z.string().optional(),
    type: z.enum(["string", "number", "boolean", "date", "enum"]),
    defaultValue: z.string().optional(),
    enumOptions: z.array(z.object({
      key: z.string().min(1, "Key is required"),
      label: z.string().min(1, "Label is required")
    })).optional()
  }))
});

type TableFormValues = z.infer<typeof schema>;

interface CreateTableDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTableDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: CreateTableDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<TableFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: "",
      label: "",
      messageTypes: [{ key: "", label: "" }],
      columns: [{ key: "message", label: "Message", type: "string" }]
    }
  });

  const { fields: messageTypeFields, append: appendMessageType, remove: removeMessageType } = useFieldArray({
    control: form.control,
    name: "messageTypes"
  });

  const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({
    control: form.control,
    name: "columns"
  });

  const handleSubmit = async (values: TableFormValues) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (data.code === 200) {
        toast.success("Table created successfully");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error("Failed to create table");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Table</DialogTitle>
          <DialogDescription>
            Define the table structure, including message types (日志类型) and columns.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form id="create-table-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Key (Unique)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. error_logs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">日志类型</h3>
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

              <div className="space-y-4 border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Columns (Fields)</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendColumn({ key: "", label: "", type: "string" })}>
                    <Plus className="h-4 w-4 mr-1" /> Add Column
                  </Button>
                </div>
                {columnFields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex gap-2 items-start">
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
                                <SelectItem value="enum">Enum</SelectItem>
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

                    {
                      form.watch(`columns.${index}.type`) === "enum" && (
                        <div className="ml-4 pl-4 border-l-2 border-slate-200 mt-2 space-y-2 py-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-500">Enum Options</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                const currentOptions = form.getValues(`columns.${index}.enumOptions`) || [];
                                form.setValue(`columns.${index}.enumOptions`, [...currentOptions, { key: "", label: "" }]);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Option
                            </Button>
                          </div>

                          {(form.watch(`columns.${index}.enumOptions`) || []).map((opt, optIndex) => (
                            <div key={optIndex} className="flex gap-2 items-start">
                              <FormField
                                control={form.control}
                                name={`columns.${index}.enumOptions.${optIndex}.label`}
                                render={({ field }) => (
                                  <FormItem className="flex-[2]">
                                    <FormControl>
                                      <Input placeholder="Label (e.g. Active)" className="h-8 text-sm" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`columns.${index}.enumOptions.${optIndex}.key`}
                                render={({ field }) => (
                                  <FormItem className="flex-[2]">
                                    <FormControl>
                                      <Input placeholder="Key (e.g. active)" className="h-8 text-sm" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-0.5 h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  const currentOptions = form.getValues(`columns.${index}.enumOptions`) || [];
                                  form.setValue(`columns.${index}.enumOptions`, currentOptions.filter((_, i) => i !== optIndex));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </div>
                ))}
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button type="submit" form="create-table-form" disabled={loading}>
            {loading ? "Creating..." : "Create Table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}

