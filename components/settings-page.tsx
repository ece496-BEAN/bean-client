'use client'

import React from 'react'
import { Bell, Moon, Sun, User, Lock, CreditCard, HelpCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SettingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Edit Profile</span>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Change Password</span>
                <Button variant="outline" size="sm">Change</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                <Switch />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <Sun className="w-5 h-5 mr-2" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Dark Mode</span>
                <Switch />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Color Theme</span>
                <Select defaultValue="default">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
                <Switch />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Data Sharing</span>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Manage Payment Methods</span>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Default Payment Method</span>
                <Select defaultValue="visa">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select card" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa (...1234)</SelectItem>
                    <SelectItem value="mastercard">Mastercard (...5678)</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Help & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">FAQs</span>
                <Button variant="outline" size="sm">View</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Contact Support</span>
                <Button variant="outline" size="sm">Contact</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Privacy Policy</span>
                <Button variant="outline" size="sm">View</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Terms of Service</span>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}