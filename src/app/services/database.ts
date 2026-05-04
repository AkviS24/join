// import { Injectable, signal } from '@angular/core';
// import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// @Injectable({
//   providedIn: 'root',
// })
// export class Database {
//   supabaseUrl = 'https://ihqvvagcuemrsbalsksp.supabase.co';
//   supabaseKey = 'sb_publishable_N4wmb3jqA8vxuofrj9kFPg_45-BAgZo';
//   supabase = createClient(this.supabaseUrl, this.supabaseKey);

//   demoDaten = signal<{ id: number, created_at: string, name: string, email: string, password: string, phone: number, isLoggedIn: boolean }[]>([]);
//   channels: RealtimeChannel | undefined;

//   async getData() {
//     let { data: contacts, error } = await this.supabase
//       .from('contacts')
//       .select('*')
//       .order('name', { ascending: true });
//     if (!contacts) return
//     this.demoDaten.set(contacts)

//     this.channels = this.supabase.channel('custom-all-channel')
//       .on(
//         'postgres_changes',
//         { event: '*', schema: 'public', table: 'contacts' },
//         (payload) => {
//           console.log('Change received!', payload)
//         }
//       )
//       .subscribe()
//   }

//   ngOnDestroy() {
//     this.supabase.removeChannel(this.channels!);
//   }

//   async setData(demoData: { name: string, email: string, password: string, phone: number }) {
//     const { data, error } = await this.supabase
//       .from('contacts')
//       .insert([demoData])
//       .select()
//   }

//   async UpdateDatas(id: number, name: string, email: string, password: string, phone: number) {
//     const { data, error } = await this.supabase
//       .from('contacts')
//       .update({ name, email, password, phone })
//       .select()
//       .eq('id', id)
//   }

//   async deleteData(id: number) {
//     const { data, error } = await this.supabase
//       .from('contacts')
//       .delete()
//       .select()
//       .eq('id', id)
//   }
// }
