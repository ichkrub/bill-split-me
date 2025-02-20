import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUpTemporaryUser() {
  // Generate a random email and password
  const randomId = crypto.randomUUID();
  const email = `temp_${randomId}@billsplit.me`;
  const password = `temp_${randomId}`;

  // Sign up the user
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    throw signUpError;
  }

  return user;
}

export async function uploadReceipt(file: File): Promise<string | null> {
  try {
    // First ensure user is signed in
    let { data: { user } } = await supabase.auth.getUser();
    
    // If no user, create a temporary one
    let currentUser = user;
    if (!currentUser) {
      currentUser = await signUpTemporaryUser();
      if (!currentUser) {
        throw new Error('Failed to create temporary user');
      }
    }

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage upload failed:', uploadError);
      throw uploadError;
    }

    // Get the public URL using the getPublicUrl method
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    // Log success and URL for verification
    console.log('Receipt uploaded successfully to Supabase!');
    console.log('Public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading receipt to Supabase:', error);
    return null;
  }
}

export async function getBillById(billId: string) {
  try {
    if (!billId) {
      throw new Error('Invalid bill ID');
    }

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('bill_id', billId)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    if (!data) {
      throw new Error('This bill doesn\'t exist or has expired');
    }

    return data;
  } catch (error) {
    console.error('Error fetching bill:', error);
    throw error;
  }
}