import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { type ContactList, type InsertContactList } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Filter, Edit, Trash2, Mail, TrendingUp } from "lucide-react";

export default function ListsSegments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contactLists = [], isLoading } = useQuery<ContactList[]>({
    queryKey: ["/api/contact-lists"],
  });

  const { data: contactStats } = useQuery<{
    activeContacts: number;
    segments: number;
    avgEngagement: string;
  }>({
    queryKey: ["/api/contacts/stats"],
  });

  const createListMutation = useMutation({
    mutationFn: (data: InsertContactList) => apiRequest("POST", "/api/contact-lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Contact list created successfully",
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Error creating list:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/contact-lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      toast({
        title: "Success",
        description: "Contact list deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description?: string }) => 
      apiRequest("PUT", `/api/contact-lists/${data.id}`, {
        name: data.name,
        description: data.description || ""
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      setIsEditDialogOpen(false);
      setEditingList(null);
      toast({
        title: "Success",
        description: "Contact list updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update list",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertContactList>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: InsertContactList) => {
    console.log("Form submitted with data:", data);
    if (!data.name || data.name.trim() === "") {
      toast({
        title: "Validation Error",
        description: "List name is required",
        variant: "destructive",
      });
      return;
    }
    createListMutation.mutate(data);
  };

  const handleDeleteList = (id: number) => {
    if (confirm("Are you sure you want to delete this list? This action cannot be undone.")) {
      deleteListMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lists & Segments</h1>
          <p className="text-muted-foreground mt-1">
            Organize your contacts into targeted lists and segments for better campaign performance.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Contact List</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Newsletter Subscribers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this contact list..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createListMutation.isPending}>
                    {createListMutation.isPending ? "Creating..." : "Create List"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Lists</p>
                <p className="text-2xl font-bold">{contactLists?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Contacts</p>
                <p className="text-2xl font-bold">{contactStats?.activeContacts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Segments</p>
                <p className="text-2xl font-bold">{contactStats?.segments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Engagement</p>
                <p className="text-2xl font-bold">{contactStats?.avgEngagement || "0%"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Lists */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Contact Lists</h2>
        {!contactLists || contactLists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contact lists yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first contact list to start organizing your subscribers.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contactLists.map((list) => (
              <Card key={list.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      {list.description && (
                        <p className="text-muted-foreground mt-1">{list.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingList(list);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                        disabled={deleteListMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      <Badge variant="secondary">
                        0 contacts
                      </Badge>
                      <Badge variant="outline">
                        Created {list.createdAt ? new Date(list.createdAt).toLocaleDateString() : "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Contacts
                      </Button>
                      <Button size="sm">
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit List Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-list-name" className="block text-sm font-medium mb-2">
                List Name *
              </label>
              <Input
                id="edit-list-name"
                placeholder="e.g., Newsletter Subscribers"
                value={editingList?.name || ""}
                onChange={(e) =>
                  setEditingList(editingList ? { ...editingList, name: e.target.value } : null)
                }
                required
              />
            </div>
            <div>
              <label htmlFor="edit-list-description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                id="edit-list-description"
                placeholder="Describe this contact list..."
                value={editingList?.description || ""}
                onChange={(e) =>
                  setEditingList(editingList ? { ...editingList, description: e.target.value } : null)
                }
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingList(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingList && editingList.name.trim()) {
                    updateListMutation.mutate({
                      id: editingList.id,
                      name: editingList.name,
                      description: editingList.description,
                    });
                  }
                }}
                disabled={!editingList?.name || updateListMutation.isPending}
              >
                {updateListMutation.isPending ? "Updating..." : "Update List"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
