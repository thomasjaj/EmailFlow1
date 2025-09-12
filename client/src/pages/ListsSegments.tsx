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
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactListSchema, type ContactList, type InsertContactList } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Filter, Edit, Trash2, Mail, TrendingUp } from "lucide-react";

export default function ListsSegments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
    mutationFn: (data: InsertContactList) => apiRequest("/api/contact-lists", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Contact list created successfully",
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

  const deleteListMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/contact-lists/${id}`, "DELETE"),
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

  const form = useForm<InsertContactList>({
    resolver: zodResolver(insertContactListSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: InsertContactList) => {
    createListMutation.mutate(data);
  };

  const handleDeleteList = (id: string) => {
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
                <p className="text-2xl font-bold">{contactLists.length}</p>
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
                <p className="text-2xl font-bold">{contactStats.activeContacts || 0}</p>
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
                <p className="text-2xl font-bold">{contactStats.segments || 0}</p>
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
                <p className="text-2xl font-bold">{contactStats.avgEngagement || "0%"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Lists */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Contact Lists</h2>
        {contactLists.length === 0 ? (
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
                      <Button variant="outline" size="sm">
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
                        {/* This will be populated once we add contact counts */}
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
    </div>
  );
}