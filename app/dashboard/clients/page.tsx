'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { clientApi } from '@/lib/api';
import { Client, ClientType, PaginatedResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Loader2,
  Building2,
  Tag,
} from 'lucide-react';

export default function ClientsPage() {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    primaryContact: '',
    secondaryContact: '',
    address: '',
    clientTypeId: 'none',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchClientTypes();
  }, [page, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      const data = response.data as PaginatedResponse<Client>;
      setClients(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientTypes = async () => {
    try {
      const response = await clientApi.getTypes();
      setClientTypes(response.data?.data || []);
    } catch (error: any) {
      console.error('Failed to fetch client types:', error);
      setClientTypes([]);
    }
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        primaryContact: client.primaryContact,
        secondaryContact: client.secondaryContact || '',
        address: client.address || '',
        clientTypeId: client.clientTypeId || 'none',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        primaryContact: '',
        secondaryContact: '',
        address: '',
        clientTypeId: 'none',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const submitData = {
        ...formData,
        secondaryContact: formData.secondaryContact || undefined,
        address: formData.address || undefined,
        clientTypeId: formData.clientTypeId === 'none' ? undefined : formData.clientTypeId,
      };

      if (editingClient) {
        await clientApi.update(editingClient.id, submitData);
        toast.success('Client updated successfully');
      } else {
        await clientApi.create(submitData);
        toast.success('Client created successfully');
      }

      setIsDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save client');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await clientApi.delete(id);
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete client');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Client Master</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Manage all your clients and their information</p>
        </div>
        {/* Desktop Button */}
        <Button
          onClick={() => handleOpenDialog()}
          className="hidden md:flex gradient-primary text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Mobile Floating Action Button */}
      <Button
        onClick={() => handleOpenDialog()}
        className="md:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-primary text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 p-0"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Search and Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search clients by name, contact, or address..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            All Clients ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No clients found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Get started by creating your first client'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Contact</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Address</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="border-slate-800 hover:bg-slate-800/30"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-200">{client.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-slate-300 text-sm">
                              <Phone className="w-3 h-3 mr-1.5 text-slate-500" />
                              {client.primaryContact}
                            </div>
                            {client.secondaryContact && (
                              <div className="flex items-center text-slate-400 text-xs">
                                <Phone className="w-3 h-3 mr-1.5 text-slate-600" />
                                {client.secondaryContact}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.clientType ? (
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                              {client.clientType.name}
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.address ? (
                            <div className="flex items-start text-slate-400 text-sm max-w-xs">
                              <MapPin className="w-3 h-3 mr-1.5 mt-0.5 text-slate-500 flex-shrink-0" />
                              <span className="line-clamp-2">{client.address}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              client.isActive
                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }
                          >
                            {client.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(client)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id, client.name)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {clients.map((client) => (
                  <Card key={client.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 space-y-3">
                      {/* Name and Status */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-200 truncate">{client.name}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            client.isActive
                              ? 'bg-green-500/10 text-green-400 border-green-500/30 flex-shrink-0'
                              : 'bg-red-500/10 text-red-400 border-red-500/30 flex-shrink-0'
                          }
                        >
                          {client.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Primary Contact */}
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Primary</p>
                          <p className="text-sm text-slate-300">{client.primaryContact}</p>
                        </div>
                      </div>

                      {/* Secondary Contact */}
                      {client.secondaryContact && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-500">Secondary</p>
                            <p className="text-sm text-slate-400">{client.secondaryContact}</p>
                          </div>
                        </div>
                      )}

                      {/* Client Type */}
                      {client.clientType && (
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-500">Type</p>
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                              {client.clientType.name}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Address */}
                      {client.address && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Address</p>
                            <p className="text-sm text-slate-400">{client.address}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenDialog(client)}
                          className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(client.id, client.name)}
                          className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingClient
                ? 'Update client information'
                : 'Create a new client profile'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Client Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="ABC Construction"
              />
            </div>

            {/* Primary Contact */}
            <div className="space-y-2">
              <Label htmlFor="primaryContact" className="text-slate-200">
                Primary Contact *
              </Label>
              <Input
                id="primaryContact"
                value={formData.primaryContact}
                onChange={(e) =>
                  setFormData({ ...formData, primaryContact: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Secondary Contact */}
            <div className="space-y-2">
              <Label htmlFor="secondaryContact" className="text-slate-200">
                Secondary Contact
              </Label>
              <Input
                id="secondaryContact"
                value={formData.secondaryContact}
                onChange={(e) =>
                  setFormData({ ...formData, secondaryContact: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="+91 98765 43211"
              />
            </div>

            {/* Client Type */}
            <div className="space-y-2">
              <Label htmlFor="clientType" className="text-slate-200">
                Client Type
              </Label>
              <Select
                value={formData.clientTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientTypeId: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">
                    None
                  </SelectItem>
                  {clientTypes.map((type) => (
                    <SelectItem
                      key={type.id}
                      value={type.id}
                      className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-200">
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="123 Main Street, City"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={formLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="gradient-primary text-white"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingClient ? (
                  'Update Client'
                ) : (
                  'Create Client'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
