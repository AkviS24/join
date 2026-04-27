import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://ihqvvagcuemrsbalsksp.supabase.co/rest/v1/';
  supabaseKey = 'sb_publishable_N4wmb3jqA8vxuofrj9kFPg_45-BAgZo';
  supabase = createClient(this.supabaseUrl, this.supabaseKey);
}
