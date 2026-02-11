
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FilePlus, Scaling, Settings2, Shield } from "lucide-react";

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
import { useFileSystem } from "@/contexts/file-system-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


const createFileSchema = z.object({
  name: z.string().min(1, "File name is required."),
  size: z.coerce.number().int().min(1, "Size must be at least 1.").max(1000, "Size cannot exceed 1000."),
});

interface CreateFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFileDialog({ open, onOpenChange }: CreateFileDialogProps) {
  const { createFile, diskSize, allocationStrategy } = useFileSystem();
  const form = useForm<z.infer<typeof createFileSchema>>({
    resolver: zodResolver(createFileSchema.refine(data => {
      const requiredSize = allocationStrategy === 'indexed' ? data.size + 1 : data.size;
      return requiredSize <= diskSize;
    }, {
      message: `Size cannot exceed total disk size of ${diskSize} blocks.`,
      path: ["size"],
    })),
    defaultValues: { name: "", size: 1 },
  });

  function onSubmit(values: z.infer<typeof createFileSchema>) {
    createFile(values.name, values.size);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            form.reset();
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus />
            Create New File
          </DialogTitle>
          <DialogDescription>
            Enter a name and size (in blocks) for your new file. Files without an extension will default to .txt.
            {allocationStrategy === 'indexed' && ' Note: Indexed allocation will use 1 extra block for the index.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., document.txt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size (in data blocks)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={diskSize} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit">Create File</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


const settingsSchema = z.object({
  diskSize: z.coerce.number().int().min(50, "Minimum size is 50.").max(1000, "Maximum size is 1000."),
});

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { diskSize, updateDiskSize } = useFileSystem();
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { diskSize: diskSize },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    updateDiskSize(values.diskSize);
    onOpenChange(false);
  }

  React.useEffect(() => {
      if (open) {
          form.reset({ diskSize: diskSize });
      }
  }, [diskSize, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 />
            System Settings
          </DialogTitle>
          <DialogDescription>
            Configure the file system properties.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="diskSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disk Size (50-1000 blocks)</FormLabel>
                  <FormControl>
                    <Input type="number" min="50" max="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit">Apply Settings</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const resizeFileSchema = z.object({
  fileId: z.string().min(1, "Please select a file."),
  newSize: z.coerce.number().int().min(1, "Size must be at least 1.").max(1000, "Size cannot exceed 1000."),
});

interface ResizeFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResizeFileDialog({ open, onOpenChange }: ResizeFileDialogProps) {
  const { files, resizeFile, diskSize } = useFileSystem();

  const form = useForm<z.infer<typeof resizeFileSchema>>({
    resolver: zodResolver(resizeFileSchema),
    defaultValues: {
        fileId: "",
        newSize: 1,
    }
  });

  const selectedFileId = form.watch("fileId");

  React.useEffect(() => {
    if (selectedFileId) {
      const file = files.find(f => f.id === selectedFileId);
      if (file) {
        form.setValue("newSize", file.size);
      }
    }
  }, [selectedFileId, files, form]);

  React.useEffect(() => {
    if (!open) {
      form.reset({ fileId: "", newSize: 1 });
    }
  }, [open, form]);

  function onSubmit(values: z.infer<typeof resizeFileSchema>) {
    resizeFile(values.fileId, values.newSize);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scaling />
            Resize File
          </DialogTitle>
          <DialogDescription>
            Select a file and specify its new size in blocks. The file will be re-allocated using the currently active allocation strategy.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="fileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a file to resize" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {files.map(file => (
                                <SelectItem key={file.id} value={file.id}>
                                    {file.name} ({file.size} blocks{file.indexBlock !== undefined && ' +1 index'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Size (in data blocks)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={diskSize} {...field} disabled={!selectedFileId} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit">Resize File</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const permissionSchema = z.object({
    fileId: z.string().min(1, "Please select a file."),
    permissions: z.string().regex(/^[0-7]{3}$/, "Must be a 3-digit octal number (e.g., 755)."),
});

interface ChangePermissionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
  
export function ChangePermissionDialog({ open, onOpenChange }: ChangePermissionDialogProps) {
    const { files, changePermission } = useFileSystem();

    const form = useForm<z.infer<typeof permissionSchema>>({
        resolver: zodResolver(permissionSchema),
        defaultValues: { fileId: "", permissions: "" }
    });

    const selectedFileId = form.watch("fileId");

    React.useEffect(() => {
        if (selectedFileId) {
            const file = files.find(f => f.id === selectedFileId);
            if (file) {
                form.setValue("permissions", file.permissions);
            }
        }
    }, [selectedFileId, files, form]);
    
    React.useEffect(() => {
        if (!open) {
          form.reset({ fileId: "", permissions: "" });
        }
    }, [open, form]);

    function onSubmit(values: z.infer<typeof permissionSchema>) {
        changePermission(values.fileId, values.permissions);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Shield />
                    Change Permissions (chmod)
                </DialogTitle>
                <DialogDescription>
                    Select a file and set its new permissions using a 3-digit octal code (e.g., 755 for rwxr-xr-x).
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="fileId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>File</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a file" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {files.map(file => (
                                    <SelectItem key={file.id} value={file.id}>
                                        {file.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="permissions"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Permissions (Octal)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., 755" {...field} disabled={!selectedFileId} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter className="pt-4">
                    <Button type="submit">Set Permissions</Button>
                </DialogFooter>
                </form>
            </Form>
            </DialogContent>
        </Dialog>
    );
}
