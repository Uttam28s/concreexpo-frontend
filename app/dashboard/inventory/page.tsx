'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi, materialApi, appointmentApi, clientApi } from '@/lib/api';
import { StockBalance, Material, Appointment, Client, PaginatedResponse, InventoryTransaction } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  Building2,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [stockData, setStockData] = useState<StockBalance[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [siteTransactions, setSiteTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteTransactionsLoading, setSiteTransactionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('stock');
  const [sitePage, setSitePage] = useState(1);
  const [siteTotalPages, setSiteTotalPages] = useState(1);
  const [siteTotalCount, setSiteTotalCount] = useState(0);
  const [stockTotalCount, setStockTotalCount] = useState(0);

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
    clientId: '',
    siteAddress: '',
    appointmentId: '',
    remarks: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });
  const [stockOutLoading, setStockOutLoading] = useState(false);

  useEffect(() => {
    fetchStockData();
    fetchMaterials();
    fetchAppointments();
    fetchClients();
  }, []);

  useEffect(() => {
    if (activeTab === 'sites') {
      fetchSiteTransactions();
    }
  }, [activeTab, sitePage]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getStock({
        search: searchTerm,
      });
      const data = response.data.data;
      setStockData(data);
      setStockTotalCount(data.length);
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

  const fetchClients = async () => {
    try {
      const response = await clientApi.getAll({ limit: 1000 });
      const data = response.data as PaginatedResponse<Client>;
      setClients((data.data || []).filter((c) => c.isActive));
    } catch (error: any) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchSiteTransactions = async () => {
    try {
      setSiteTransactionsLoading(true);
      const response = await inventoryApi.getTransactions({
        type: 'STOCK_OUT',
        page: sitePage,
        limit: 10,
      });
      const data = response.data as PaginatedResponse<InventoryTransaction>;
      setSiteTransactions(data.data || []);
      setSiteTotalPages(data.pagination.totalPages);
      setSiteTotalCount(data.pagination.total);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch site transactions');
    } finally {
      setSiteTransactionsLoading(false);
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
        clientId: stockOutData.clientId || undefined,
        siteAddress: stockOutData.siteAddress || undefined,
        appointmentId: stockOutData.appointmentId || undefined,
        remarks: stockOutData.remarks || undefined,
        transactionDate: stockOutData.transactionDate,
      });

      toast.success('Stock removed successfully');
      setIsStockOutOpen(false);
      setStockOutData({
        materialId: '',
        quantity: '',
        clientId: '',
        siteAddress: '',
        appointmentId: '',
        remarks: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      fetchStockData();
      // Refresh site transactions if on that tab
      if (activeTab === 'sites') {
        fetchSiteTransactions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove stock');
    } finally {
      setStockOutLoading(false);
    }
  };

  const filteredStock = (stockData || []).filter((item) =>
    item.material?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Inventory Management</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Track stock levels and transactions</p>
        </div>
        {/* Desktop Buttons */}
        <div className="hidden md:flex space-x-3">
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

      {/* Mobile Floating Action Buttons */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Button
          onClick={() => setIsStockInOpen(true)}
          className="h-14 w-14 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 p-0"
          title="Stock In"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
        <Button
          onClick={() => setIsStockOutOpen(true)}
          className="h-14 w-14 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 p-0"
          title="Stock Out"
        >
          <MinusCircle className="h-6 w-6" />
        </Button>
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

      {/* Tabs for Stock and Site Transactions */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="stock" className="data-[state=active]:bg-slate-800">
            Material Inventory
          </TabsTrigger>
          <TabsTrigger value="sites" className="data-[state=active]:bg-slate-800">
            Site Transactions
          </TabsTrigger>
        </TabsList>

        {/* Stock Table */}
        <TabsContent value="stock">
          <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            Current Stock Levels ({stockTotalCount})
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
            <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-lg border border-slate-800 overflow-hidden">
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredStock.map((item) => (
                <Card key={item.materialId} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4 space-y-3">
                    {/* Material Name & Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{item.material.name}</p>
                          <p className="text-xs text-slate-500">{item.material.unit}</p>
                        </div>
                      </div>
                      {item.isLowStock ? (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex-shrink-0">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/30 flex-shrink-0">
                          In Stock
                        </Badge>
                      )}
                    </div>

                    {/* Stock Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700">
                      <div className="text-center">
                        <div className="flex items-center justify-center text-green-400 mb-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                        </div>
                        <p className="text-sm font-medium text-slate-200">{item.totalIn}</p>
                        <p className="text-xs text-slate-500">Stock In</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-red-400 mb-1">
                          <TrendingDown className="w-3 h-3 mr-1" />
                        </div>
                        <p className="text-sm font-medium text-slate-200">{item.totalOut}</p>
                        <p className="text-xs text-slate-500">Stock Out</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-blue-400 mb-1">
                          <Boxes className="w-3 h-3" />
                        </div>
                        <p className="text-lg font-bold text-slate-100">{item.currentStock}</p>
                        <p className="text-xs text-slate-500">Current</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Site Transactions Tab */}
        <TabsContent value="sites">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Materials Sent to Sites ({siteTotalCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {siteTransactionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : siteTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-slate-600" />
                  <p className="mt-4 text-slate-400">No site transactions found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Stock out materials will appear here
                  </p>
                </div>
              ) : (
                <>
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-lg border border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Date</TableHead>
                        <TableHead className="text-slate-300">Material</TableHead>
                        <TableHead className="text-slate-300">Client/Site</TableHead>
                        <TableHead className="text-slate-300 text-right">Quantity</TableHead>
                        <TableHead className="text-slate-300">Site Address</TableHead>
                        <TableHead className="text-slate-300">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {siteTransactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="border-slate-800 hover:bg-slate-800/30"
                        >
                          <TableCell>
                            <div className="flex items-center text-slate-300 text-sm">
                              <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                              {new Date(transaction.transactionDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-200">{transaction.material.name}</p>
                                <p className="text-xs text-slate-500">{transaction.material.unit}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.client ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                  <Building2 className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="font-medium text-slate-200">
                                  {transaction.client.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end text-red-400">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              <span className="font-medium">{transaction.quantity}</span>
                              <span className="text-sm text-slate-400 ml-1">{transaction.material.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.siteAddress ? (
                              <div className="flex items-start text-slate-400 text-sm max-w-xs">
                                <MapPin className="w-3 h-3 mr-1.5 mt-0.5 text-slate-500 flex-shrink-0" />
                                <span className="line-clamp-2">{transaction.siteAddress}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.remarks ? (
                              <span className="text-slate-400 text-sm line-clamp-1">
                                {transaction.remarks}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {siteTransactions.map((transaction) => (
                    <Card key={transaction.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4 space-y-3">
                        {/* Date */}
                        <div className="flex items-center text-slate-300 text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" />
                          <span>{format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}</span>
                        </div>

                        {/* Material */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500">Material</p>
                            <p className="font-medium text-slate-200">{transaction.material.name}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-red-400">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              <span className="font-medium">{transaction.quantity}</span>
                              <span className="text-sm text-slate-400 ml-1">{transaction.material.unit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Client/Site */}
                        {transaction.client && (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Client</p>
                              <p className="font-medium text-slate-200">{transaction.client.name}</p>
                            </div>
                          </div>
                        )}

                        {/* Site Address */}
                        {transaction.siteAddress && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-slate-500">Site Address</p>
                              <p className="text-sm text-slate-400">{transaction.siteAddress}</p>
                            </div>
                          </div>
                        )}

                        {/* Remarks */}
                        {transaction.remarks && (
                          <div className="flex items-start space-x-2">
                            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-slate-500">Remarks</p>
                              <p className="text-sm text-slate-400">{transaction.remarks}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {siteTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
                    <p className="text-sm text-slate-400">
                      Page {sitePage} of {siteTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSitePage(sitePage - 1)}
                        disabled={sitePage === 1}
                        className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSitePage(sitePage + 1)}
                        disabled={sitePage === siteTotalPages}
                        className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="stockOutClient" className="text-slate-200">
                Client/Site (Optional)
              </Label>
              <Select
                value={stockOutData.clientId || undefined}
                onValueChange={(value) =>
                  setStockOutData({ ...stockOutData, clientId: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {clients.map((client) => (
                    <SelectItem
                      key={client.id}
                      value={client.id}
                      className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                value={stockOutData.appointmentId || undefined}
                onValueChange={(value) =>
                  setStockOutData({ ...stockOutData, appointmentId: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="None (Optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
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
