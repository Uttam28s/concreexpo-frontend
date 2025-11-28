'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi, materialApi, appointmentApi } from '@/lib/api';
import { StockBalance, Material, Appointment, PaginatedResponse } from '@/types';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Search,
  Package,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Boxes,
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [stockData, setStockData] = useState<StockBalance[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Side panels
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);

  // Stock In form
  const [stockInData, setStockInData] = useState({
    materialId: '',
    quantity: '',
    remarks: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });
  const [stockInLoading, setStockInLoading] = useState(false);

  // Stock Out form
  const [stockOutData, setStockOutData] = useState({
    materialId: '',
    quantity: '',
    siteAddress: '',
    appointmentId: 'none',
    remarks: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });
  const [stockOutLoading, setStockOutLoading] = useState(false);

  useEffect(() => {
    fetchStockData();
    fetchMaterials();
    fetchAppointments();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getStock({
        search: searchTerm,
      });
      setStockData(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await materialApi.getAll({ limit: 1000 });
      const data = response.data as PaginatedResponse<Material>;
      setMaterials(data.data.filter((m) => m.isActive));
    } catch (error: any) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentApi.getAll({ limit: 1000 });
      const data = response.data as PaginatedResponse<Appointment>;
      setAppointments(data.data.filter((a) => ['VERIFIED', 'COMPLETED'].includes(a.status)));
    } catch (error: any) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockInLoading(true);

    try {
      await inventoryApi.stockIn({
        materialId: stockInData.materialId,
        quantity: Number(stockInData.quantity),
        remarks: stockInData.remarks || undefined,
        transactionDate: stockInData.transactionDate,
      });

      toast.success('Stock added successfully');
      setIsStockInOpen(false);
      setStockInData({
        materialId: '',
        quantity: '',
        remarks: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      fetchStockData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add stock');
    } finally {
      setStockInLoading(false);
    }
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockOutLoading(true);

    try {
      await inventoryApi.stockOut({
        materialId: stockOutData.materialId,
        quantity: Number(stockOutData.quantity),
        siteAddress: stockOutData.siteAddress || undefined,
        appointmentId: stockOutData.appointmentId === 'none' ? undefined : stockOutData.appointmentId,
        remarks: stockOutData.remarks || undefined,
        transactionDate: stockOutData.transactionDate,
      });

      toast.success('Stock removed successfully');
      setIsStockOutOpen(false);
      setStockOutData({
        materialId: '',
        quantity: '',
        siteAddress: '',
        appointmentId: 'none',
        remarks: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      fetchStockData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove stock');
    } finally {
      setStockOutLoading(false);
    }
  };

  const filteredStock = stockData.filter((item) =>
    item.material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Inventory Management</h1>
          <p className="text-slate-400 mt-1">Track stock levels and transactions</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setIsStockInOpen(true)}
            className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Stock In
          </Button>
          <Button
            onClick={() => setIsStockOutOpen(true)}
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
          >
            <MinusCircle className="mr-2 h-4 w-4" />
            Stock Out
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            Current Stock Levels ({filteredStock.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-12">
              <Boxes className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No stock data found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Add materials to track inventory'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Material</TableHead>
                    <TableHead className="text-slate-300 text-right">Stock In</TableHead>
                    <TableHead className="text-slate-300 text-right">Stock Out</TableHead>
                    <TableHead className="text-slate-300 text-right">Current Stock</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => (
                    <TableRow
                      key={item.materialId}
                      className="border-slate-800 hover:bg-slate-800/30"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{item.material.name}</p>
                            <p className="text-xs text-slate-500">{item.material.unit}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end text-green-400">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          <span className="font-medium">{item.totalIn}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end text-red-400">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          <span className="font-medium">{item.totalOut}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xl font-bold text-slate-100">
                          {item.currentStock}
                        </span>
                        <span className="text-sm text-slate-400 ml-1">{item.material.unit}</span>
                      </TableCell>
                      <TableCell>
                        {item.isLowStock ? (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock In Sheet */}
      <Sheet open={isStockInOpen} onOpenChange={setIsStockInOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-slate-100 w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-100">Stock In</SheetTitle>
            <SheetDescription className="text-slate-400">
              Add new stock to inventory
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleStockIn} className="space-y-4 mt-6">
            {/* Material */}
            <div className="space-y-2">
              <Label htmlFor="stockInMaterial" className="text-slate-200">
                Material *
              </Label>
              <Select
                value={stockInData.materialId}
                onValueChange={(value) =>
                  setStockInData({ ...stockInData, materialId: value })
                }
                required
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {materials.map((material) => (
                    <SelectItem
                      key={material.id}
                      value={material.id}
                      className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {material.name} ({material.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="stockInQuantity" className="text-slate-200">
                Quantity *
              </Label>
              <Input
                id="stockInQuantity"
                type="number"
                min="1"
                value={stockInData.quantity}
                onChange={(e) =>
                  setStockInData({ ...stockInData, quantity: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="Enter quantity"
              />
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="stockInDate" className="text-slate-200">
                Transaction Date *
              </Label>
              <Input
                id="stockInDate"
                type="date"
                value={stockInData.transactionDate}
                onChange={(e) =>
                  setStockInData({ ...stockInData, transactionDate: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="stockInRemarks" className="text-slate-200">
                Remarks
              </Label>
              <textarea
                id="stockInRemarks"
                value={stockInData.remarks}
                onChange={(e) =>
                  setStockInData({ ...stockInData, remarks: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Optional notes..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStockInOpen(false)}
                disabled={stockInLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={stockInLoading}
                className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
              >
                {stockInLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Stock'
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Stock Out Sheet */}
      <Sheet open={isStockOutOpen} onOpenChange={setIsStockOutOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-slate-100 w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-100">Stock Out</SheetTitle>
            <SheetDescription className="text-slate-400">
              Remove stock from inventory
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleStockOut} className="space-y-4 mt-6">
            {/* Material */}
            <div className="space-y-2">
              <Label htmlFor="stockOutMaterial" className="text-slate-200">
                Material *
              </Label>
              <Select
                value={stockOutData.materialId}
                onValueChange={(value) =>
                  setStockOutData({ ...stockOutData, materialId: value })
                }
                required
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {materials.map((material) => (
                    <SelectItem
                      key={material.id}
                      value={material.id}
                      className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {material.name} ({material.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="stockOutQuantity" className="text-slate-200">
                Quantity *
              </Label>
              <Input
                id="stockOutQuantity"
                type="number"
                min="1"
                value={stockOutData.quantity}
                onChange={(e) =>
                  setStockOutData({ ...stockOutData, quantity: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="Enter quantity"
              />
            </div>

            {/* Site Address */}
            <div className="space-y-2">
              <Label htmlFor="stockOutSite" className="text-slate-200">
                Site Address
              </Label>
              <Input
                id="stockOutSite"
                value={stockOutData.siteAddress}
                onChange={(e) =>
                  setStockOutData({ ...stockOutData, siteAddress: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="Delivery location"
              />
            </div>

            {/* Appointment */}
            <div className="space-y-2">
              <Label htmlFor="stockOutAppointment" className="text-slate-200">
                Link to Appointment (Optional)
              </Label>
              <Select
                value={stockOutData.appointmentId}
                onValueChange={(value) =>
                  setStockOutData({ ...stockOutData, appointmentId: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select appointment" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">
                    None
                  </SelectItem>
                  {appointments.map((appt) => (
                    <SelectItem
                      key={appt.id}
                      value={appt.id}
                      className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {appt.client.name} - {new Date(appt.visitDate).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="stockOutDate" className="text-slate-200">
                Transaction Date *
              </Label>
              <Input
                id="stockOutDate"
                type="date"
                value={stockOutData.transactionDate}
                onChange={(e) =>
                  setStockOutData({ ...stockOutData, transactionDate: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="stockOutRemarks" className="text-slate-200">
                Remarks
              </Label>
              <textarea
                id="stockOutRemarks"
                value={stockOutData.remarks}
                onChange={(e) =>
                  setStockOutData({ ...stockOutData, remarks: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Optional notes..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStockOutOpen(false)}
                disabled={stockOutLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={stockOutLoading}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
              >
                {stockOutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove Stock'
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
