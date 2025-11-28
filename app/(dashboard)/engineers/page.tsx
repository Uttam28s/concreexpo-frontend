'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { engineerApi } from '@/lib/api';
import { Engineer, PaginatedResponse } from '@/types';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Loader2,
  Wrench,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EngineersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchEngineers();
    }
  }, [page, searchTerm, user]);

  const fetchEngineers = async () => {
    try {
      setLoading(true);
      const response = await engineerApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      const data = response.data as PaginatedResponse<Engineer>;
      setEngineers(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch engineers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (engineer?: Engineer) => {
    if (engineer) {
      setEditingEngineer(engineer);
      setFormData({
        name: engineer.name,
        email: engineer.email,
        mobileNumber: engineer.mobileNumber,
        password: '',
        isActive: engineer.isActive,
      });
    } else {
      setEditingEngineer(null);
      setFormData({
        name: '',
        email: '',
        mobileNumber: '',
        password: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingEngineer) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          isActive: formData.isActive,
        };
        await engineerApi.update(editingEngineer.id, updateData);
        toast.success('Engineer updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new engineers');
          setFormLoading(false);
          return;
        }
        await engineerApi.create(formData);
        toast.success('Engineer created successfully');
      }

      setIsDialogOpen(false);
      fetchEngineers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save engineer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await engineerApi.delete(id);
      toast.success('Engineer deleted successfully');
      fetchEngineers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete engineer');
    }
  };

  const toggleStatus = async (engineer: Engineer) => {
    try {
      await engineerApi.update(engineer.id, { isActive: !engineer.isActive });
      toast.success(
        `Engineer ${!engineer.isActive ? 'activated' : 'deactivated'} successfully`
      );
      fetchEngineers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Engineer Master</h1>
          <p className="text-slate-400 mt-1">Manage engineer accounts and permissions</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="gradient-primary text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Engineer
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search engineers by name, email, or mobile..."
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

      {/* Engineers Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            All Engineers ({engineers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : engineers.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No engineers found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Get started by creating your first engineer account'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Mobile</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engineers.map((engineer) => (
                      <TableRow
                        key={engineer.id}
                        className="border-slate-800 hover:bg-slate-800/30"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <Wrench className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-200">{engineer.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-slate-300 text-sm">
                            <Mail className="w-3 h-3 mr-1.5 text-slate-500" />
                            {engineer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-slate-300 text-sm">
                            <Phone className="w-3 h-3 mr-1.5 text-slate-500" />
                            {engineer.mobileNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleStatus(engineer)}
                            className="transition-transform hover:scale-105"
                          >
                            <Badge
                              className={
                                engineer.isActive
                                  ? 'bg-green-500/10 text-green-400 border-green-500/30 cursor-pointer'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30 cursor-pointer'
                              }
                            >
                              {engineer.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(engineer)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(engineer.id, engineer.name)}
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
              {editingEngineer ? 'Edit Engineer' : 'Add New Engineer'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingEngineer
                ? 'Update engineer information'
                : 'Create a new engineer account'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="kalpesh.dave@wallfloor.com"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="text-slate-200">
                Mobile Number *
              </Label>
              <Input
                id="mobileNumber"
                value={formData.mobileNumber}
                onChange={(e) =>
                  setFormData({ ...formData, mobileNumber: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Password (only for new engineers) */}
            {!editingEngineer && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100 pr-10"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

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
                ) : editingEngineer ? (
                  'Update Engineer'
                ) : (
                  'Create Engineer'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
