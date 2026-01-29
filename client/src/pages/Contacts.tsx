import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Download, 
  Upload,
  Users,
  UserCheck,
  UserMinus,
  Edit,
  Trash,
  Mail,
  Tag
} from "lucide-react";

interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  subscriptionDate: string;
  lastEngagementDate?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt: string;
}

interface ContactList {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

export default function Contacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedList, setSelectedList] = useState("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [newContact, setNewContact] = useState({
    email: "",
    firstName: "",
    lastName: "",
    tags: "",
  });

  const [newList, setNewList] = useState({
    name: "",
    description: "",
  });

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery<ContactsResponse>({
    queryKey: ['/api/contacts'],
  });

  // Fetch contact lists
  const { data: contactLists, isLoading: listsLoading } = useQuery<ContactList[]>({
    queryKey: ['/api/contact-lists'],
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await apiRequest('POST', '/api/contacts', contactData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShowAddContact(false);
      setNewContact({ email: "", firstName: "", lastName: "", tags: "" });
      toast({
        title: "Contact added successfully",
        description: "The contact has been added to your list.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error adding contact",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await apiRequest('DELETE', `/api/contacts/${contactId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Contact deleted successfully",
        description: "The contact has been removed from your list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting contact",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (contact: { id: number; email: string; firstName?: string; lastName?: string }) => {
      const response = await apiRequest('PUT', `/api/contacts/${contact.id}`, {
        email: contact.email,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShowEditContact(false);
      setEditingContact(null);
      toast({
        title: "Contact updated successfully",
        description: "The contact has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating contact",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Create contact list mutation
  const createListMutation = useMutation({
    mutationFn: async (listData: any) => {
      const response = await apiRequest('POST', '/api/contact-lists', listData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact-lists'] });
      setShowAddList(false);
      setNewList({ name: "", description: "" });
      toast({
        title: "Contact list created successfully",
        description: "Your new contact list is ready to use.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error creating list",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleCreateContact = () => {
    if (!newContact.email) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const contactData = {
      ...newContact,
      tags: newContact.tags ? newContact.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
    };

    createContactMutation.mutate(contactData);
  };

  const handleCreateList = () => {
    if (!newList.name) {
      toast({
        title: "List name required",
        description: "Please enter a name for the contact list.",
        variant: "destructive",
      });
      return;
    }

    createListMutation.mutate(newList);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'unsubscribed': return 'bg-red-100 text-red-800';
      case 'bounced': return 'bg-orange-100 text-orange-800';
      case 'complained': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContacts = contactsData?.contacts?.filter(contact => {
    const matchesSearch = contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(filteredContacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleDeleteContact = (contactId: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  if (contactsLoading || listsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
            <p className="text-slate-600 mt-1">Manage your subscriber lists and contacts.</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalContacts = contactsData?.total || 0;
  const activeContacts = filteredContacts.filter(c => c.status === 'active').length;
  const unsubscribedContacts = filteredContacts.filter(c => c.status === 'unsubscribed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
          <p className="text-slate-600 mt-1">Manage your subscriber lists and contacts.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={showImport} onOpenChange={setShowImport}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Contacts</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>CSV File</Label>
                  <Input type="file" accept=".csv" className="mt-1" />
                  <p className="text-sm text-slate-500 mt-1">
                    Upload a CSV file with columns: email, firstName, lastName, tags
                  </p>
                </div>
                <Button className="w-full">Import Contacts</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddList} onOpenChange={setShowAddList}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Contact List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listName">List Name*</Label>
                  <Input
                    id="listName"
                    value={newList.name}
                    onChange={(e) => setNewList(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter list name"
                  />
                </div>
                <div>
                  <Label htmlFor="listDescription">Description</Label>
                  <Textarea
                    id="listDescription"
                    value={newList.description}
                    onChange={(e) => setNewList(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                <Button onClick={handleCreateList} disabled={createListMutation.isPending} className="w-full">
                  {createListMutation.isPending ? 'Creating...' : 'Create List'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newContact.firstName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newContact.lastName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newContact.tags}
                    onChange={(e) => setNewContact(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="customer, premium, newsletter"
                  />
                </div>
                <Button onClick={handleCreateContact} disabled={createContactMutation.isPending} className="w-full">
                  {createContactMutation.isPending ? 'Adding...' : 'Add Contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Total Contacts</h3>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalContacts.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">All contacts in your database</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Active Subscribers</h3>
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{activeContacts.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">
              {totalContacts > 0 ? Math.round((activeContacts / totalContacts) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Unsubscribed</h3>
              <UserMinus className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{unsubscribedContacts.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">
              {totalContacts > 0 ? Math.round((unsubscribedContacts / totalContacts) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedList} onValueChange={setSelectedList}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Lists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lists</SelectItem>
            {contactLists?.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="complained">Complained</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Add to List
                </Button>
                <Button variant="outline" size="sm">
                  Export Selected
                </Button>
                <Button variant="destructive" size="sm">
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Contacts</CardTitle>
            <span className="text-sm text-slate-500">
              {filteredContacts.length} of {totalContacts} contacts
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Tags</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Subscribed</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <Mail className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {contact.firstName || contact.lastName 
                                ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                : contact.email.split('@')[0]}
                            </div>
                            <div className="text-sm text-slate-500">{contact.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.slice(0, 2).map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                          {contact.tags && contact.tags.length > 2 && (
                            <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                              +{contact.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(contact.subscriptionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingContact(contact);
                              setShowEditContact(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No contacts found</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || statusFilter !== 'all' || selectedList !== 'all'
                  ? "Try adjusting your search or filters."
                  : "Add your first contact to get started."}
              </p>
              {!searchQuery && statusFilter === 'all' && selectedList === 'all' && (
                <Button onClick={() => setShowAddContact(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditContact} onOpenChange={setShowEditContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <Input
                id="edit-email"
                type="email"
                placeholder="contact@example.com"
                value={editingContact?.email || ""}
                onChange={(e) =>
                  setEditingContact(editingContact ? { ...editingContact, email: e.target.value } : null)
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-firstName" className="block text-sm font-medium mb-2">
                  First Name
                </label>
                <Input
                  id="edit-firstName"
                  placeholder="John"
                  value={editingContact?.firstName || ""}
                  onChange={(e) =>
                    setEditingContact(editingContact ? { ...editingContact, firstName: e.target.value } : null)
                  }
                />
              </div>
              <div>
                <label htmlFor="edit-lastName" className="block text-sm font-medium mb-2">
                  Last Name
                </label>
                <Input
                  id="edit-lastName"
                  placeholder="Doe"
                  value={editingContact?.lastName || ""}
                  onChange={(e) =>
                    setEditingContact(editingContact ? { ...editingContact, lastName: e.target.value } : null)
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditContact(false);
                  setEditingContact(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingContact) {
                    updateContactMutation.mutate({
                      id: editingContact.id,
                      email: editingContact.email,
                      firstName: editingContact.firstName,
                      lastName: editingContact.lastName,
                    });
                  }
                }}
                disabled={!editingContact?.email || updateContactMutation.isPending}
              >
                {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
